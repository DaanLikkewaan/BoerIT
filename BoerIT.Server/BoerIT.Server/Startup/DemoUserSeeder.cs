using System.Text.Json;
using BoerIT.Service.Interfaces;

namespace BoerIT.Server.Startup;

/// <summary>
/// Provisions the demo accounts listed in the <c>DemoUsers</c> setting.
///
/// WHY A JSON STRING AND NOT A CONFIG SECTION?
/// The list comes from a single deployment secret (a GitHub environment secret
/// copied into an App Service app setting). One value is far easier to paste,
/// rotate and remove than a family of <c>DemoUsers__0__Email</c>-style keys, and
/// passwords never have to live in the repository.
///
/// Expected shape:
/// <code>
/// [
///   { "email": "jan@example.com", "password": "…", "firstName": "Jan", "lastName": "Botha" }
/// ]
/// </code>
///
/// Runs on every startup and is idempotent: missing users are created, and a
/// user whose password no longer matches the setting has it reset.
/// </summary>
public static class DemoUserSeeder
{
    private sealed record DemoUser(string Email, string Password, string FirstName, string LastName);

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static async Task SeedAsync(WebApplication app)
    {
        var raw = app.Configuration["DemoUsers"];
        if (string.IsNullOrWhiteSpace(raw)) return;

        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DemoUserSeeder));

        List<DemoUser>? users;
        try
        {
            users = JsonSerializer.Deserialize<List<DemoUser>>(raw, JsonOptions);
        }
        catch (JsonException ex)
        {
            // Fail the startup loudly: a demo where nobody can sign in is worse
            // than a deployment that visibly did not come up.
            throw new InvalidOperationException("The DemoUsers setting is not valid JSON.", ex);
        }

        using var scope = app.Services.CreateScope();
        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();

        foreach (var user in users ?? [])
        {
            if (string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.Password))
                throw new InvalidOperationException("Every entry in DemoUsers needs an email and a password.");

            var changed = await authService.EnsureUserAsync(
                user.Email, user.Password, user.FirstName ?? "", user.LastName ?? "");

            // Never log the password — only which account was touched.
            if (changed) logger.LogInformation("Provisioned demo user {Email}", user.Email);
        }
    }
}
