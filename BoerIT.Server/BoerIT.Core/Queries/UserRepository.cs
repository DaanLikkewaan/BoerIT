using BoerIT.Core.Interfaces;
using BoerIT.Core.Models;
using Dapper;
using Npgsql;

namespace BoerIT.Core.Queries;

public class UserRepository(string connectionString) : IUserRepository
{
    private NpgsqlConnection CreateConnection() => new(connectionString);

    public async Task<User?> GetByIdAsync(Guid id)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<User>(
            "SELECT * FROM users WHERE id = @Id", new { Id = id });
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<User>(
            "SELECT * FROM users WHERE email = @Email", new { Email = email.ToLower() });
    }

    public async Task<User> CreateAsync(User user)
    {
        using var conn = CreateConnection();
        const string sql = """
            INSERT INTO users (id, email, password_hash, first_name, last_name, created_at)
            VALUES (@Id, @Email, @PasswordHash, @FirstName, @LastName, @CreatedAt)
            RETURNING *;
            """;
        return await conn.QuerySingleAsync<User>(sql, user);
    }

    public async Task<User> UpdateAsync(User user)
    {
        using var conn = CreateConnection();
        const string sql = """
            UPDATE users
            SET first_name = @FirstName,
                last_name   = @LastName,
                email       = @Email,
                updated_at  = @UpdatedAt
            WHERE id = @Id
            RETURNING *;
            """;
        user.UpdatedAt = DateTime.UtcNow;
        return await conn.QuerySingleAsync<User>(sql, user);
    }

    public async Task<bool> ExistsAsync(string email)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<bool>(
            "SELECT COUNT(1) FROM users WHERE email = @Email", new { Email = email.ToLower() });
    }
}
