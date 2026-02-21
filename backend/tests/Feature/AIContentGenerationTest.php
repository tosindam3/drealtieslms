<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AIContentGenerationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => User::ROLE_ADMINISTRATOR,
        ]);
    }

    public function test_admin_can_generate_module_content()
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'title' => 'Test Module',
                                        'description' => 'Test Description',
                                        'lessons' => []
                                    ])
                                ]
                            ]
                        ]
                    ]
                ]
            ], 200),
        ]);

        /** @var \App\Models\User $admin */
        $admin = $this->admin;
        $response = $this->actingAs($admin)
            ->postJson('/api/admin/ai/generate', [
                'type' => 'module',
                'prompt' => 'Introduction to Laravel',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'title' => 'Test Module',
                ]
            ]);
    }

    public function test_unauthorized_user_cannot_generate_content()
    {
        /** @var \Illuminate\Contracts\Auth\Authenticatable $student */
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)
            ->postJson('/api/admin/ai/generate', [
                'type' => 'module',
                'prompt' => 'Introduction to Laravel',
            ]);

        $response->assertStatus(403);
    }
}
