using BoerIT.Core.Models;
using BoerIT.Server.DTOs;
using BoerIT.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BoerIT.Server.Controllers;

[Route("api/farms/{farmId:guid}/parameters")]
public class ParametersController(IParameterService parameterService) : AuthenticatedController
{
    // ── Farm Parameters ──────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetParameters(Guid farmId)
    {
        var parameters = await parameterService.GetParametersAsync(farmId, CurrentUserId);
        return Ok(parameters);
    }

    [HttpPut]
    public async Task<IActionResult> UpsertParameters(Guid farmId, [FromBody] UpsertParametersRequest request)
    {
        var models = request.Parameters.Select(p => new FarmParameter
        {
            ParameterKey = p.ParameterKey,
            ParameterValue = p.ParameterValue,
            Unit = p.Unit,
            Category = p.Category
        });

        await parameterService.UpsertParametersAsync(farmId, CurrentUserId, models);
        return NoContent();
    }

    [HttpDelete("{key}")]
    public async Task<IActionResult> DeleteParameter(Guid farmId, string key)
    {
        await parameterService.DeleteParameterAsync(farmId, CurrentUserId, key);
        return NoContent();
    }

    // ── Livestock Groups ─────────────────────────────────────────────────────

    [HttpGet("livestock")]
    public async Task<IActionResult> GetLivestockGroups(Guid farmId)
    {
        var groups = await parameterService.GetLivestockGroupsAsync(farmId, CurrentUserId);
        return Ok(groups.Select(MapToResponse));
    }

    [HttpPut("livestock")]
    public async Task<IActionResult> UpsertLivestockGroup(Guid farmId, [FromBody] LivestockGroupRequest request)
    {
        var group = new LivestockGroup
        {
            Species = request.Species,
            Category = request.Category,
            CurrentCount = request.CurrentCount,
            TargetCount = request.TargetCount,
            AverageAgemonths = request.AverageAgeMonths,
            AverageWeightKg = request.AverageWeightKg
        };

        var result = await parameterService.UpsertLivestockGroupAsync(farmId, CurrentUserId, group);
        return Ok(MapToResponse(result));
    }

    [HttpDelete("livestock/{groupId:guid}")]
    public async Task<IActionResult> DeleteLivestockGroup(Guid farmId, Guid groupId)
    {
        await parameterService.DeleteLivestockGroupAsync(farmId, CurrentUserId, groupId);
        return NoContent();
    }

    private static LivestockGroupResponse MapToResponse(LivestockGroup g) =>
        new(g.Id, g.FarmId, g.Species, g.Category, g.CurrentCount,
            g.TargetCount, g.AverageAgemonths, g.AverageWeightKg, g.CreatedAt, g.UpdatedAt);
}
