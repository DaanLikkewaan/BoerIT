using BoerIT.Server.DTOs;
using BoerIT.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BoerIT.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
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
