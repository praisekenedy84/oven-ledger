<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ShopSetting extends Model
{
    public const DEFAULT_PRIMARY = '#9C2B3A';

    public const DEFAULT_ACCENT = '#E3A72B';

    protected $fillable = [
        'shop_name',
        'logo_path',
        'primary_color',
        'accent_color',
    ];

    public static function current(): self
    {
        $settings = static::query()->first();

        if ($settings) {
            return $settings;
        }

        return static::query()->create([
            'primary_color' => self::DEFAULT_PRIMARY,
            'accent_color' => self::DEFAULT_ACCENT,
        ]);
    }

    public function logoUrl(): ?string
    {
        if (! filled($this->logo_path)) {
            return null;
        }

        return Storage::disk('public')->url($this->logo_path);
    }

    /**
     * @return array{shop_name: string|null, logo_url: string|null, primary_color: string, accent_color: string}
     */
    public function toBrandArray(): array
    {
        return [
            'shop_name' => $this->shop_name,
            'logo_url' => $this->logoUrl(),
            'primary_color' => $this->primary_color ?: self::DEFAULT_PRIMARY,
            'accent_color' => $this->accent_color ?: self::DEFAULT_ACCENT,
        ];
    }
}
