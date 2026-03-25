<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\AiFaq;
use App\Models\AiKnowledge;
use App\Models\CannedReply;
use App\Models\Company;
use App\Models\Lead;
use App\Models\Message;
use App\Models\PopupRule;
use App\Models\Session;
use App\Models\User;
use App\Models\Visitor;
use App\Models\Website;
use App\Models\WebsiteSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (Account::count() > 0) {
            $this->command->info('Data exists — skipping.');
            return;
        }

        // ─── Account ───────────────────────────────────────────────────────
        $account = Account::create([
            'name'           => 'Hotel Tech Group',
            'saas_tenant_id' => 'demo-tenant-001',
            'plan'           => 'pro',
            'is_active'      => true,
        ]);

        // ─── Users ─────────────────────────────────────────────────────────
        $admin = User::create([
            'account_id'    => $account->id,
            'email'         => 'info@hotel-tech.ai',
            'password_hash' => Hash::make('First-Design-Studio'),
            'display_name'  => 'Super Admin',
            'role'          => 'admin',
            'is_online'     => true,
            'is_active'     => true,
        ]);

        $agent = User::create([
            'account_id'    => $account->id,
            'email'         => 'user@hotel-tech.ai',
            'password_hash' => Hash::make('First-Design-Studio'),
            'display_name'  => 'Regular User',
            'role'          => 'agent',
            'is_online'     => true,
            'is_active'     => true,
        ]);

        // ─── Company ───────────────────────────────────────────────────────
        $company = Company::create([
            'account_id'     => $account->id,
            'name'           => 'Grand Hotel Vienna',
            'description'    => 'Luxury 5-star hotel in the heart of Vienna',
            'timezone'       => 'Europe/Vienna',
            'business_hours' => [
                'monday'    => ['09:00', '22:00'],
                'tuesday'   => ['09:00', '22:00'],
                'wednesday' => ['09:00', '22:00'],
                'thursday'  => ['09:00', '22:00'],
                'friday'    => ['09:00', '23:00'],
                'saturday'  => ['10:00', '23:00'],
                'sunday'    => ['10:00', '22:00'],
            ],
            'is_active' => true,
        ]);

        $admin->companies()->attach($company->id, ['role' => 'admin']);
        $agent->companies()->attach($company->id, ['role' => 'agent']);

        // ─── Websites ──────────────────────────────────────────────────────
        $website = Website::create([
            'company_id' => $company->id,
            'name'       => 'Grand Hotel Website',
            'domain'     => 'grandhotelvienna.com',
            'widget_key' => Str::uuid(),
            'is_active'  => true,
        ]);

        $admin->websites()->attach($website->id);
        $agent->websites()->attach($website->id);

        // ─── Widget Settings ───────────────────────────────────────────────
        $widgetSettings = [
            'primary_color'    => '#2563eb',
            'welcome_message'  => 'Welcome to Grand Hotel Vienna! How can we help you today?',
            'offline_message'  => 'We\'re currently offline. Leave a message and we\'ll get back to you.',
            'ai_enabled'       => 'true',
            'ai_auto_reply'    => 'true',
            'position'         => 'bottom-right',
            'language'         => 'en',
        ];

        foreach ($widgetSettings as $k => $v) {
            WebsiteSetting::create(['website_id' => $website->id, 'key_name' => $k, 'value' => $v]);
        }

        // ─── Visitors & Sessions ───────────────────────────────────────────
        $visitors = [
            ['name' => 'John Smith',      'email' => 'john.smith@email.com',   'country' => 'United States', 'city' => 'New York'],
            ['name' => 'Maria Garcia',    'email' => 'maria.garcia@email.com', 'country' => 'Spain',         'city' => 'Madrid'],
            ['name' => 'Yuki Tanaka',     'email' => 'yuki.t@email.com',       'country' => 'Japan',         'city' => 'Tokyo'],
            ['name' => null,              'email' => null,                      'country' => 'Germany',       'city' => 'Berlin'],
            ['name' => 'Pierre Dupont',   'email' => 'p.dupont@email.com',     'country' => 'France',        'city' => 'Paris'],
        ];

        $conversations = [
            [
                'visitor' => 0, 'status' => 'active',
                'messages' => [
                    ['visitor', 'Hello, I\'d like to book a suite for next weekend. Do you have availability?'],
                    ['agent', 'Welcome, Mr. Smith! Let me check our suite availability for you. Which dates are you looking at?'],
                    ['visitor', 'Friday to Sunday, March 27-29.'],
                    ['agent', 'I can see our Grand Suite is available for those dates at EUR 450/night. Would you like me to reserve it?'],
                ],
            ],
            [
                'visitor' => 1, 'status' => 'active',
                'messages' => [
                    ['visitor', 'Hola! Do you offer spa packages for couples?'],
                    ['ai', 'Hello! Yes, we offer several couples spa packages. Our most popular is the "Vienna Romance" package at EUR 299, which includes a 60-minute couples massage, thermal bath access, and a champagne aperitif. Would you like more details?'],
                    ['visitor', 'That sounds wonderful! Can we book it for Saturday?'],
                ],
            ],
            [
                'visitor' => 2, 'status' => 'resolved',
                'messages' => [
                    ['visitor', 'What time does the restaurant open for breakfast?'],
                    ['ai', 'Our restaurant serves breakfast from 7:00 AM to 10:30 AM on weekdays, and from 7:30 AM to 11:00 AM on weekends. We offer a full buffet as well as à la carte options.'],
                    ['visitor', 'Perfect, thank you!'],
                    ['system', 'Session resolved by visitor.'],
                ],
            ],
            [
                'visitor' => 3, 'status' => 'active',
                'messages' => [
                    ['visitor', 'Is parking available at the hotel?'],
                ],
            ],
            [
                'visitor' => 4, 'status' => 'offline',
                'messages' => [
                    ['visitor', 'Bonjour, I need to cancel my reservation #HT-2026-4521. Is there a cancellation fee?'],
                    ['agent', 'Hello Mr. Dupont. I can help you with that. Let me look up your reservation.'],
                ],
            ],
        ];

        foreach ($conversations as $conv) {
            $vData   = $visitors[$conv['visitor']];
            $visitor = Visitor::create([
                'website_id'   => $website->id,
                'visitor_uuid' => Str::uuid(),
                'name'         => $vData['name'],
                'email'        => $vData['email'],
                'country'      => $vData['country'],
                'city'         => $vData['city'],
                'ip_address'   => '192.168.1.' . rand(10, 250),
            ]);

            $session = Session::create([
                'visitor_id'       => $visitor->id,
                'website_id'       => $website->id,
                'assigned_user_id' => $conv['status'] !== 'resolved' ? $agent->id : null,
                'status'           => $conv['status'],
                'channel'          => 'web',
                'last_message_at'  => now()->subMinutes(rand(1, 120)),
            ]);

            $unread = 0;
            foreach ($conv['messages'] as $msg) {
                Message::create([
                    'session_id'     => $session->id,
                    'sender_type'    => $msg[0],
                    'sender_user_id' => $msg[0] === 'agent' ? $agent->id : null,
                    'content'        => $msg[1],
                    'content_type'   => 'text',
                    'is_read'        => $msg[0] !== 'visitor',
                ]);
                if ($msg[0] === 'visitor') $unread++;
            }

            $session->update(['unread_count' => $unread]);
        }

        // ─── Leads ─────────────────────────────────────────────────────────
        Lead::create([
            'website_id' => $website->id, 'name' => 'John Smith', 'email' => 'john.smith@email.com',
            'message' => 'Interested in corporate events', 'source' => 'chat', 'status' => 'new',
        ]);
        Lead::create([
            'website_id' => $website->id, 'name' => 'Pierre Dupont', 'email' => 'p.dupont@email.com',
            'phone' => '+33612345678', 'message' => 'Wedding reception inquiry', 'source' => 'chat', 'status' => 'contacted',
        ]);

        // ─── Canned Replies ────────────────────────────────────────────────
        $replies = [
            ['shortcut' => '/welcome', 'title' => 'Welcome', 'content' => 'Welcome to Grand Hotel Vienna! How may I assist you today?', 'category' => 'Greetings'],
            ['shortcut' => '/hours', 'title' => 'Business Hours', 'content' => 'Our front desk is open 24/7. Restaurant: 7am-10pm. Spa: 8am-9pm. Bar: 4pm-midnight.', 'category' => 'Info'],
            ['shortcut' => '/checkin', 'title' => 'Check-in Info', 'content' => 'Check-in is from 3:00 PM and check-out by 11:00 AM. Early check-in may be available upon request.', 'category' => 'Info'],
            ['shortcut' => '/transfer', 'title' => 'Transfer Agent', 'content' => 'Let me transfer you to a specialist who can better assist you. One moment please.', 'category' => 'Actions'],
        ];

        foreach ($replies as $r) {
            CannedReply::create(array_merge($r, ['company_id' => $company->id]));
        }

        // ─── Popup Rules ───────────────────────────────────────────────────
        PopupRule::create([
            'website_id'     => $website->id,
            'name'           => 'Welcome after 5 seconds',
            'trigger_type'   => 'time_delay',
            'trigger_config' => ['delay_seconds' => 5],
            'message'        => 'Welcome! Looking for the perfect room? Let us help you find it.',
            'is_active'      => true,
            'priority'       => 10,
        ]);
        PopupRule::create([
            'website_id'     => $website->id,
            'name'           => 'Exit intent offer',
            'trigger_type'   => 'exit_intent',
            'trigger_config' => [],
            'message'        => 'Wait! Book now and get 10% off your stay. Chat with us for the special code.',
            'is_active'      => true,
            'priority'       => 20,
        ]);

        // ─── AI FAQs ──────────────────────────────────────────────────────
        $faqs = [
            ['q' => 'What are the check-in and check-out times?', 'a' => 'Check-in is from 3:00 PM and check-out is by 11:00 AM. Early check-in and late check-out may be arranged subject to availability.'],
            ['q' => 'Is breakfast included?', 'a' => 'Breakfast is included with most room rates. Our buffet breakfast is served from 7:00 AM to 10:30 AM in the main restaurant.'],
            ['q' => 'Do you have a spa?', 'a' => 'Yes! Our wellness center features a thermal pool, sauna, steam room, and a full menu of massage and beauty treatments. Open daily 8 AM to 9 PM.'],
            ['q' => 'Is there free WiFi?', 'a' => 'Complimentary high-speed WiFi is available throughout the hotel, including all guest rooms and public areas.'],
            ['q' => 'What is the cancellation policy?', 'a' => 'Free cancellation up to 48 hours before arrival. Cancellations within 48 hours are charged one night\'s stay.'],
        ];

        foreach ($faqs as $f) {
            AiFaq::create(['company_id' => $company->id, 'question' => $f['q'], 'answer' => $f['a'], 'category' => 'General']);
        }

        // ─── AI Knowledge ──────────────────────────────────────────────────
        AiKnowledge::create([
            'company_id' => $company->id,
            'topic'      => 'Hotel Overview',
            'content'    => 'Grand Hotel Vienna is a luxury 5-star hotel located in the 1st district of Vienna, near Stephansdom. 245 rooms and suites, 3 restaurants, full spa, rooftop bar, and conference facilities for up to 500 guests.',
            'category'   => 'General',
        ]);
        AiKnowledge::create([
            'company_id' => $company->id,
            'topic'      => 'Room Types & Pricing',
            'content'    => 'Classic Room: EUR 189/night, Deluxe Room: EUR 249/night, Junior Suite: EUR 349/night, Grand Suite: EUR 450/night, Presidential Suite: EUR 890/night. All rates include breakfast and WiFi.',
            'category'   => 'Rooms',
        ]);

        $this->command->info('Seeded: 1 account, 2 users, 1 company, 1 website, 5 visitors, 5 sessions, 15 messages, 2 leads, 4 canned replies, 2 popup rules, 5 FAQs, 2 knowledge items.');
    }
}
