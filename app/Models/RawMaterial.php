<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RawMaterial extends Model
{
    protected $fillable = [
        'name',
        'unit_of_measure',
        'reorder_threshold',
    ];

    protected function casts(): array
    {
        return [
            'reorder_threshold' => 'decimal:3',
        ];
    }

    public function branchStock(): HasMany
    {
        return $this->hasMany(BranchRawMaterialStock::class);
    }
}
