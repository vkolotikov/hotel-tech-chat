<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'account_id'    => 1,
            'email'         => fake()->unique()->safeEmail(),
            'password_hash' => Hash::make('password'),
            'display_name'  => fake()->name(),
            'role'          => 'agent',
            'is_online'     => false,
            'is_active'     => true,
        ];
    }
}
