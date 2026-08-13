using BoerIT.Core.Models;
using BoerIT.Server.DTOs;
using BoerIT.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BoerIT.Server.Controllers;

[Route("api/[controller]")]
public class FarmsController(IFarmService farmService) : AuthenticatedController
{
    [HttpGet]
    public async Task<IActionResult> GetFarms()
    {
        var farms = await farmService.GetUserFarmsAsync(CurrentUserId);
        return Ok(farms.Select(MapToResponse));
    }

    [HttpGet("{farmId:guid}")]
    public async Task<IActionResult> GetFarm(Guid farmId)
    {
        var farm = await farmService.GetFarmAsync(farmId, CurrentUserId);
        return farm is null ? NotFound() : Ok(MapToResponse(farm));
    }

    [HttpPost]
    public async Task<IActionResult> CreateFarm([FromBody] CreateFarmRequest request)
    {
        var farm = await farmService.CreateFarmAsync(
            CurrentUserId,
            request.Name,
            request.Description,
            request.Location,
            request.LandHectares);

        return CreatedAtAction(nameof(GetFarm), new { farmId = farm.Id }, MapToResponse(farm));
    }

    [HttpPut("{farmId:guid}")]
    public async Task<IActionResult> UpdateFarm(Guid farmId, [FromBody] UpdateFarmRequest request)
    {
        var farm = await farmService.UpdateFarmAsync(
            farmId,
            CurrentUserId,
            request.Name,
            request.Description,
            request.Location,
            request.LandHectares);

        return Ok(MapToResponse(farm));
    }

    [HttpDelete("{farmId:guid}")]
    public async Task<IActionResult> DeleteFarm(Guid farmId)
    {
        await farmService.DeleteFarmAsync(farmId, CurrentUserId);
        return NoContent();
    }

    private static FarmResponse MapToResponse(Farm f) =>
        new(f.Id, f.UserId, f.Name, f.Description, f.Location, f.LandHectares, f.CreatedAt, f.UpdatedAt);
}
