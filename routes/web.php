<?php

use Illuminate\Support\Facades\Route;

// Redirect to static HTML files served directly by nginx.
// When browser is at /admin/index.html, relative assets like
// "styles.css" resolve to /admin/styles.css — which nginx serves
// from public/admin/styles.css. No PHP injection needed.

Route::get('/', fn () => redirect('/admin/index.html', 302));
Route::get('/admin', fn () => redirect('/admin/index.html', 302));
Route::get('/admin/', fn () => redirect('/admin/index.html', 302));

Route::get('/admin/{page}', function (string $page) {
    $file = public_path("admin/{$page}.html");
    return redirect(file_exists($file) ? "/admin/{$page}.html" : '/admin/index.html', 302);
})->where('page', '[a-z\-]+');
