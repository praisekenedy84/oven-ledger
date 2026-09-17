<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\OwnerTransaction;
use App\Models\Product;
use App\Models\Recipe;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class CatalogEconomics
{
    public const CHANNELS = ['retail', 'wholesale', 'restaurant'];

    /** @var array<int, float>|null */
    protected ?array $requestUnitCostMap = null;

    public function syncPrices(Product $product, array $prices): void
    {
        foreach (self::CHANNELS as $channel) {
            $value = $prices[$channel] ?? null;

            if ($value === null || $value === '') {
                $product->priceLists()->where('channel', $channel)->delete();

                continue;
            }

            $product->priceLists()->updateOrCreate(
                ['channel' => $channel],
                ['price' => $value]
            );
        }
    }

    /**
     * @return array{retail: float|null, wholesale: float|null, restaurant: float|null}
     */
    public function priceMap(Product $product): array
    {
        $map = array_fill_keys(self::CHANNELS, null);

        foreach ($product->priceLists as $row) {
            $map[$row->channel] = (float) $row->price;
        }

        return $map;
    }

    /**
     * @return array{batch_cost: float, unit_cost: float, lines: list<array<string, mixed>>}
     */
    public function recipeCost(Recipe $recipe): array
    {
        $recipe->loadMissing('ingredients.rawMaterial');

        $lines = [];
        $batch = 0.0;

        foreach ($recipe->ingredients as $ingredient) {
            $unitCost = (float) ($ingredient->rawMaterial?->unit_cost ?? 0);
            $lineCost = round($unitCost * (float) $ingredient->quantity, 2);
            $batch += $lineCost;

            $lines[] = [
                'id' => $ingredient->id,
                'raw_material_id' => $ingredient->raw_material_id,
                'name' => $ingredient->rawMaterial?->name,
                'quantity' => (float) $ingredient->quantity,
                'unit' => $ingredient->unit,
                'unit_cost' => $unitCost,
                'line_cost' => $lineCost,
            ];
        }

        $yield = (float) $recipe->expected_yield;
        $unitCost = $yield > 0 ? round($batch / $yield, 2) : 0.0;

        return [
            'batch_cost' => round($batch, 2),
            'unit_cost' => $unitCost,
            'lines' => $lines,
        ];
    }

    public function unitCostForProduct(Product $product): float
    {
        $product->loadMissing('recipe.ingredients.rawMaterial');

        if ($product->isTrading()) {
            return (float) ($product->cost_price ?? 0);
        }

        if ($product->recipe) {
            return $this->recipeCost($product->recipe)['unit_cost'];
        }

        return (float) ($product->cost_price ?? 0);
    }

    /**
     * @return array<int, float>
     */
    public function unitCostMap(?Collection $products = null): array
    {
        if ($products === null && $this->requestUnitCostMap !== null) {
            return $this->requestUnitCostMap;
        }

        if ($products !== null) {
            return $this->buildUnitCostMap($products);
        }

        $tenantId = tenant('id');
        $resolver = fn () => $this->buildUnitCostMap(
            Product::query()
                ->with(['recipe.ingredients.rawMaterial:id,unit_cost'])
                ->get(['id', 'type', 'cost_price'])
        );

        if (! $tenantId) {
            return $this->requestUnitCostMap = $resolver();
        }

        return $this->requestUnitCostMap = Cache::remember(
            $this->unitCostCacheKey($tenantId),
            now()->addMinutes(2),
            $resolver
        );
    }

    public function forgetUnitCostMap(?string $tenantId = null): void
    {
        $this->requestUnitCostMap = null;
        $tenantId = $tenantId ?? tenant('id');

        if ($tenantId) {
            Cache::forget($this->unitCostCacheKey($tenantId));
        }
    }

    protected function unitCostCacheKey(string $tenantId): string
    {
        return "tenant:{$tenantId}:unit_cost_map";
    }

    /**
     * @return array<int, float>
     */
    protected function buildUnitCostMap(Collection $products): array
    {
        $map = [];

        foreach ($products as $product) {
            $map[$product->id] = $this->unitCostForProduct($product);
        }

        return $map;
    }

    /**
     * @return array{
     *     revenue: float,
     *     ingredient_cost: float,
     *     profit: float,
     *     is_profit: bool,
     *     is_loss: bool,
     *     capital_in: float,
     *     drawings: float,
     *     capital_remaining: float
     * }
     */
    public function profitability(?Carbon $from = null, ?Carbon $to = null, ?int $branchId = null): array
    {
        $items = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.status', 'completed')
            ->when($from && $to, fn ($query) => $query->whereBetween('orders.created_at', [$from, $to]))
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->get([
                'order_items.product_id',
                'order_items.quantity',
                'order_items.line_total',
            ]);

        $unitCosts = $this->unitCostMap();
        $revenue = 0.0;
        $cogs = 0.0;

        foreach ($items as $item) {
            $revenue += (float) $item->line_total;
            $cogs += ($unitCosts[$item->product_id] ?? 0) * (float) $item->quantity;
        }

        $ownerTotals = OwnerTransaction::query()
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'capital_injection' THEN amount ELSE 0 END), 0) as capital_in,
                COALESCE(SUM(CASE WHEN type = 'drawing' THEN amount ELSE 0 END), 0) as drawings
            ")
            ->first();

        $capitalIn = (float) ($ownerTotals?->capital_in ?? 0);
        $drawings = (float) ($ownerTotals?->drawings ?? 0);
        $profit = round($revenue - $cogs, 2);

        return [
            'revenue' => round($revenue, 2),
            'ingredient_cost' => round($cogs, 2),
            'profit' => $profit,
            'is_profit' => $profit > 0.009,
            'is_loss' => $profit < -0.009,
            'capital_in' => $capitalIn,
            'drawings' => $drawings,
            'capital_remaining' => round($capitalIn - $drawings, 2),
        ];
    }
}
