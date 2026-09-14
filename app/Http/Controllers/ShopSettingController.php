<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use App\Models\ShopSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ShopSettingController extends Controller
{
    public function edit(): Response
    {
        $settings = ShopSetting::current();

        return Inertia::render('Settings/Shop', [
            'settings' => $settings->toBrandArray() + [
                'id' => $settings->id,
            ],
            'categories' => ProductCategory::query()
                ->withCount('products')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'kind', 'is_system', 'sort_order']),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'shop_name' => ['nullable', 'string', 'max:255'],
            'primary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accent_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'remove_logo' => ['sometimes', 'boolean'],
        ]);

        $settings = ShopSetting::current();
        $logoPath = $settings->logo_path;

        if ($request->boolean('remove_logo') && $logoPath) {
            Storage::disk('public')->delete($logoPath);
            $logoPath = null;
        }

        if ($request->hasFile('logo')) {
            if ($logoPath) {
                Storage::disk('public')->delete($logoPath);
            }

            $logoPath = $request->file('logo')->store('shop', 'public');
        }

        $settings->update([
            'shop_name' => $validated['shop_name'] ?? null,
            'primary_color' => strtoupper($validated['primary_color']),
            'accent_color' => strtoupper($validated['accent_color']),
            'logo_path' => $logoPath,
        ]);

        return back()->with('success', 'Shop branding saved.');
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:product_categories,name'],
            'kind' => ['required', Rule::in([ProductCategory::KIND_PRODUCED, ProductCategory::KIND_HARDWARE])],
        ]);

        $maxOrder = (int) ProductCategory::query()->max('sort_order');

        ProductCategory::query()->create([
            'name' => $validated['name'],
            'kind' => $validated['kind'],
            'is_system' => false,
            'sort_order' => $maxOrder + 1,
        ]);

        return back()->with('success', 'Category added.');
    }

    public function updateCategory(Request $request, ProductCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('product_categories', 'name')->ignore($category->id)],
            'kind' => ['required', Rule::in([ProductCategory::KIND_PRODUCED, ProductCategory::KIND_HARDWARE])],
        ]);

        $category->update([
            'name' => $validated['name'],
            'kind' => $validated['kind'],
        ]);

        $category->products()->update([
            'category' => $category->name,
            'type' => $category->productType(),
        ]);

        return back()->with('success', 'Category updated.');
    }

    public function destroyCategory(ProductCategory $category): RedirectResponse
    {
        if ($category->is_system) {
            return back()->withErrors(['category' => 'Starter categories stay in the list.']);
        }

        if ($category->products()->exists()) {
            return back()->withErrors(['category' => 'Move products off this category before deleting it.']);
        }

        $category->delete();

        return back()->with('success', 'Category removed.');
    }
}