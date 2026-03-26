<?php

use Illuminate\Support\Facades\Route;

// Redirect root to the original admin panel
Route::get('/', function () {
    return redirect('/admin/');
});
