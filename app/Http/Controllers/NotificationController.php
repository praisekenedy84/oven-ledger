<?php

namespace App\Http\Controllers;

use App\Services\StaffNotificationFeed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        protected StaffNotificationFeed $notifications,
    ) {}

    public function index(): Response
    {
        $feed = $this->notifications->forCurrentBranch(80);

        return Inertia::render('Notifications/Index', [
            'notifications' => $feed['items'],
            'unreadCount' => $feed['unread_count'],
        ]);
    }

    public function markRead(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'string', 'max:120'],
        ]);

        $this->notifications->markAsRead($request->user(), $validated['id']);

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $this->notifications->markAllCurrentAsRead(80);

        return back();
    }
}
