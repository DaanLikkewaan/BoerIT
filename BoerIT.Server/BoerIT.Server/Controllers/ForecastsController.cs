using BoerIT.Core.Models;
using BoerIT.Server.DTOs;
using BoerIT.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BoerIT.Server.Controllers;

[Route("api/farms/{farmId:guid}/forecasts")]
public class ForecastsController(IForecastService forecastService) : AuthenticatedController
{
    [HttpGet]
    public async Task<IActionResult> GetForecasts(Guid farmId)
    {
        var forecasts = await forecastService.GetForecastsAsync(farmId, CurrentUserId);
        return Ok(forecasts.Select(MapToSummary));
    }

    [HttpGet("{forecastId:guid}")]
    public async Task<IActionResult> GetForecast(Guid farmId, Guid forecastId)
    {
        var forecast = await forecastService.GetForecastAsync(forecastId, farmId, CurrentUserId);
        return forecast is null ? NotFound() : Ok(MapToFullResponse(forecast));
    }

    [HttpPost]
    public async Task<IActionResult> GenerateForecast(Guid farmId, [FromBody] GenerateForecastRequest request)
    {
        if (request.ForecastYears is < 1 or > 20)
            return BadRequest(new { error = "Forecast years must be between 1 and 20." });

        var forecast = await forecastService.GenerateForecastAsync(farmId, CurrentUserId, request.ForecastYears);
        return CreatedAtAction(nameof(GetForecast),
            new { farmId, forecastId = forecast.Id },
            MapToFullResponse(forecast));
    }

    [HttpDelete("{forecastId:guid}")]
    public async Task<IActionResult> DeleteForecast(Guid farmId, Guid forecastId)
    {
        await forecastService.DeleteForecastAsync(forecastId, farmId, CurrentUserId);
        return NoContent();
    }

    private static ForecastSummaryResponse MapToSummary(Forecast f) =>
        new(f.Id, f.FarmId, f.GeneratedAt, f.BaseYear, f.ForecastYears, f.Status);

    private static ForecastResponse MapToFullResponse(Forecast f) =>
        new(f.Id, f.FarmId, f.GeneratedAt, f.BaseYear, f.ForecastYears, f.Status,
            f.Years.Select(y => new ForecastYearResponse(
                y.Id, y.Year, y.TotalIncome, y.TotalExpenses, y.NetProfit,
                y.LineItems.Select(l => new ForecastLineItemResponse(
                    l.Id, l.Category, l.Description, l.Quantity, l.UnitPrice, l.Amount, l.Type
                )).ToList()
            )).ToList());
}
