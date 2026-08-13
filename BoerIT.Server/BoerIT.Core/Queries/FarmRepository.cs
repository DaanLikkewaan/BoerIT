using BoerIT.Core.Interfaces;
using BoerIT.Core.Models;
using Dapper;
using Npgsql;

namespace BoerIT.Core.Queries;

public class FarmRepository(string connectionString) : IFarmRepository
{
    private NpgsqlConnection CreateConnection() => new(connectionString);

    public async Task<Farm?> GetByIdAsync(Guid id)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Farm>(
            "SELECT * FROM farms WHERE id = @Id", new { Id = id });
    }

    public async Task<IEnumerable<Farm>> GetByUserIdAsync(Guid userId)
    {
        using var conn = CreateConnection();
        return await conn.QueryAsync<Farm>(
            "SELECT * FROM farms WHERE user_id = @UserId ORDER BY created_at DESC",
            new { UserId = userId });
    }

    public async Task<Farm> CreateAsync(Farm farm)
    {
        using var conn = CreateConnection();
        const string sql = """
            INSERT INTO farms (id, user_id, name, description, location, land_hectares, created_at)
            VALUES (@Id, @UserId, @Name, @Description, @Location, @LandHectares, @CreatedAt)
            RETURNING *;
            """;
        return await conn.QuerySingleAsync<Farm>(sql, farm);
    }

    public async Task<Farm> UpdateAsync(Farm farm)
    {
        using var conn = CreateConnection();
        const string sql = """
            UPDATE farms
            SET name           = @Name,
                description    = @Description,
                location       = @Location,
                land_hectares  = @LandHectares,
                updated_at     = @UpdatedAt
            WHERE id = @Id
            RETURNING *;
            """;
        farm.UpdatedAt = DateTime.UtcNow;
        return await conn.QuerySingleAsync<Farm>(sql, farm);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM farms WHERE id = @Id", new { Id = id });
        return rows > 0;
    }

    public async Task<bool> BelongsToUserAsync(Guid farmId, Guid userId)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<bool>(
            "SELECT COUNT(1) FROM farms WHERE id = @FarmId AND user_id = @UserId",
            new { FarmId = farmId, UserId = userId });
    }
}
