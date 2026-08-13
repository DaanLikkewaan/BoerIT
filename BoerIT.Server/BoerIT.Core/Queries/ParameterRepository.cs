using BoerIT.Core.Interfaces;
using BoerIT.Core.Models;
using Dapper;
using Npgsql;

namespace BoerIT.Core.Queries;

public class ParameterRepository(string connectionString) : IParameterRepository
{
    private NpgsqlConnection CreateConnection() => new(connectionString);

    // ── Farm Parameters ─────────────────────────────────────────────────────

    public async Task<IEnumerable<FarmParameter>> GetByFarmIdAsync(Guid farmId)
    {
        using var conn = CreateConnection();
        return await conn.QueryAsync<FarmParameter>(
            "SELECT * FROM farm_parameters WHERE farm_id = @FarmId ORDER BY category, parameter_key",
            new { FarmId = farmId });
    }

    public async Task<FarmParameter?> GetByKeyAsync(Guid farmId, string key)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<FarmParameter>(
            "SELECT * FROM farm_parameters WHERE farm_id = @FarmId AND parameter_key = @Key",
            new { FarmId = farmId, Key = key });
    }

    public async Task UpsertAsync(Guid farmId, IEnumerable<FarmParameter> parameters)
    {
        using var conn = CreateConnection();
        const string sql = """
            INSERT INTO farm_parameters (id, farm_id, parameter_key, parameter_value, unit, category, updated_at)
            VALUES (@Id, @FarmId, @ParameterKey, @ParameterValue, @Unit, @Category, @UpdatedAt)
            ON CONFLICT (farm_id, parameter_key)
            DO UPDATE SET
                parameter_value = EXCLUDED.parameter_value,
                unit            = EXCLUDED.unit,
                category        = EXCLUDED.category,
                updated_at      = EXCLUDED.updated_at;
            """;

        var now = DateTime.UtcNow;
        foreach (var p in parameters)
        {
            p.FarmId = farmId;
            p.UpdatedAt = now;
            if (p.Id == Guid.Empty) p.Id = Guid.NewGuid();
            await conn.ExecuteAsync(sql, p);
        }
    }

    public async Task<bool> DeleteByKeyAsync(Guid farmId, string key)
    {
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync(
            "DELETE FROM farm_parameters WHERE farm_id = @FarmId AND parameter_key = @Key",
            new { FarmId = farmId, Key = key });
        return rows > 0;
    }

    // ── Livestock Groups ─────────────────────────────────────────────────────

    public async Task<IEnumerable<LivestockGroup>> GetLivestockGroupsAsync(Guid farmId)
    {
        using var conn = CreateConnection();
        return await conn.QueryAsync<LivestockGroup>(
            "SELECT * FROM livestock_groups WHERE farm_id = @FarmId ORDER BY species, category",
            new { FarmId = farmId });
    }

    public async Task<LivestockGroup?> GetLivestockGroupByIdAsync(Guid id)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<LivestockGroup>(
            "SELECT * FROM livestock_groups WHERE id = @Id", new { Id = id });
    }

    public async Task<LivestockGroup> UpsertLivestockGroupAsync(LivestockGroup group)
    {
        using var conn = CreateConnection();
        const string sql = """
            INSERT INTO livestock_groups
                (id, farm_id, species, category, current_count, target_count, average_age_months, average_weight_kg, created_at, updated_at)
            VALUES
                (@Id, @FarmId, @Species, @Category, @CurrentCount, @TargetCount, @AverageAgemonths, @AverageWeightKg, @CreatedAt, @UpdatedAt)
            ON CONFLICT (farm_id, species, category)
            DO UPDATE SET
                current_count       = EXCLUDED.current_count,
                target_count        = EXCLUDED.target_count,
                average_age_months  = EXCLUDED.average_age_months,
                average_weight_kg   = EXCLUDED.average_weight_kg,
                updated_at          = EXCLUDED.updated_at
            RETURNING *;
            """;

        var now = DateTime.UtcNow;
        if (group.Id == Guid.Empty) group.Id = Guid.NewGuid();
        group.CreatedAt = now;
        group.UpdatedAt = now;

        return await conn.QuerySingleAsync<LivestockGroup>(sql, group);
    }

    public async Task<bool> DeleteLivestockGroupAsync(Guid id)
    {
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync(
            "DELETE FROM livestock_groups WHERE id = @Id", new { Id = id });
        return rows > 0;
    }
}
