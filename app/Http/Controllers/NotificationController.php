<?php

namespace App\Http\Controllers;

use App\Services\StaffNotificationFeed;
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
}
