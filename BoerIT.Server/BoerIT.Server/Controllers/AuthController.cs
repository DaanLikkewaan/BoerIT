using BoerIT.Server.DTOs;
using BoerIT.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BoerIT.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService, IConfiguration configuration) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Hosted demo environments are invite-only: accounts are provisioned from
        // the DemoUsers setting, so open sign-up is switched off there. Hiding the
        // link in the UI is not enough on its own — the endpoint must refuse too.
        if (!configuration.GetValue("Auth:AllowRegistration", defaultValue: true))
            return StatusCode(StatusCodes.Status403Forbidden,
                new { error = "Sign-up is closed. Please ask for a demo account." });

        var result = await authService.RegisterAsync(
            request.Email, request.Password, request.FirstName, request.LastName);

        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return Ok(new AuthResponse(
            result.AccessToken!,
            result.RefreshToken!,
            result.ExpiresAt!.Value,
            result.UserId!.Value,
            result.Email!,
            result.FirstName!,
            result.LastName!));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request.Email, request.Password);

        if (!result.Success)
            return Unauthorized(new { error = result.Error });

        return Ok(new AuthResponse(
            result.AccessToken!,
            result.RefreshToken!,
            result.ExpiresAt!.Value,
            result.UserId!.Value,
            result.Email!,
            result.FirstName!,
            result.LastName!));
    }
}
