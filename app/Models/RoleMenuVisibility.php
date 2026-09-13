<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleMenuVisibility extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $table = 'role_menu_visibility';

    protected $primaryKey = null;

    protected $fillable = [
        'role_id',
        'menu_item_id',
        'visible',
    ];

    protected function casts(): array
    {
        return [
            'menu_item_id' => 'integer',
            'visible' => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
}
