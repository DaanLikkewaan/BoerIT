using BoerIT.Core.Interfaces;
using BoerIT.Core.Queries;
using BoerIT.Server.Middleware;
using BoerIT.Server.Startup;
using BoerIT.DbUp;
using BoerIT.Service;
using BoerIT.Service.Interfaces;
using BoerIT.Service.Services;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Map snake_case database columns (e.g. password_hash) to PascalCase model
// properties (PasswordHash). Without this, Dapper leaves unmatched columns null.
DefaultTypeMap.MatchNamesWithUnderscores = true;

// ── Configuration ─────────────────────────────────────────────────────────────

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("JWT secret is not configured.");

// ── Database Migrations (DbUp) ────────────────────────────────────────────────

DatabaseRunner.RunMigrations(connectionString);

// ── Dependency Injection ──────────────────────────────────────────────────────

// Repositories (Core)
builder.Services.AddSingleton<IUserRepository>(_ => new UserRepository(connectionString));
builder.Services.AddSingleton<IFarmRepository>(_ => new FarmRepository(connectionString));
builder.Services.AddSingleton<IParameterRepository>(_ => new ParameterRepository(connectionString));
builder.Services.AddSingleton<IForecastRepository>(_ => new ForecastRepository(connectionString));

// Services (Business layer)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFarmService, FarmService>();
builder.Services.AddScoped<IParameterService, ParameterService>();
builder.Services.AddScoped<IForecastService, ForecastService>();

// ── Authentication (JWT Bearer) ───────────────────────────────────────────────

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────

builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJsClient", policy =>
    {
        policy
            .WithOrigins(
                builder.Configuration["Cors:AllowedOrigins"]?.Split(',')
                ?? ["http://localhost:3000"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ── Controllers & Swagger ─────────────────────────────────────────────────────

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "BoerIT API", Version = "v1" });

    // Allow JWT auth in Swagger UI
    options.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter your JWT token below."
    });

    options.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            []
        }
    });
});

// ── Build ─────────────────────────────────────────────────────────────────────

var app = builder.Build();

// ── Pipeline ──────────────────────────────────────────────────────────────────

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Skip HTTPS redirection in development so the Next.js client can talk to the
// API over plain HTTP without the browser rejecting the self-signed dev cert.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("NextJsClient");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Liveness check for the deployment pipeline's smoke test and App Service's
// health check. Reaching here means the migrations above already succeeded.
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

await DemoUserSeeder.SeedAsync(app);

app.Run();
