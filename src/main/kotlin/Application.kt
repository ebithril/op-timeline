package com

import com.config.configureDatabases
import io.bkbn.kompendium.core.plugin.NotarizedApplication
import io.bkbn.kompendium.json.schema.definition.TypeDefinition
import io.bkbn.kompendium.oas.OpenApiSpec
import io.bkbn.kompendium.oas.info.Info
import io.bkbn.kompendium.oas.security.ApiKeyAuth
import io.bkbn.kompendium.oas.security.ApiKeyLocation
import io.bkbn.kompendium.oas.server.Server
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.metrics.micrometer.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.util.*
import io.micrometer.prometheusmetrics.PrometheusConfig
import io.micrometer.prometheusmetrics.PrometheusMeterRegistry
import java.net.URI

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    // Configure Kompendium for OpenAPI documentation
    install(NotarizedApplication()) {
        spec = OpenApiSpec(
            info = Info(
                title = "One Piece Timeline API",
                version = "1.0.0",
                description = """
                    A collaborative wiki-style timeline API for tracking events in the One Piece manga.

                    ## Authentication
                    Most write operations require authentication via API key in the `X-API-Key` header.

                    ## User Roles
                    - **Viewer**: Can view all content but cannot make changes
                    - **Editor**: Can create and edit events and characters
                    - **Admin**: Full access including delete, revert, and user management
                """.trimIndent()
            ),
            servers = mutableListOf(
                Server(
                    url = URI("http://localhost:8080"),
                    description = "Local development server"
                )
            )
        )
        // Configure API key security scheme
        spec.components.securitySchemes = mutableMapOf(
            "ApiKeyAuth" to ApiKeyAuth(
                location = ApiKeyLocation.HEADER,
                name = "X-API-Key"
            )
        )
    }

    // Configure Prometheus metrics
    val appMicrometerRegistry = PrometheusMeterRegistry(PrometheusConfig.DEFAULT)
    install(MicrometerMetrics) {
        registry = appMicrometerRegistry
    }

    // Store registry in application attributes for use in routing
    attributes.put(AttributeKey("prometheus.registry"), appMicrometerRegistry)

    // Configure database
    configureDatabases()

    // Configure CORS for frontend
    install(CORS) {
	anyHost()
	allowMethod(HttpMethod.Get)
	allowMethod(HttpMethod.Post)
	allowMethod(HttpMethod.Put)
	allowMethod(HttpMethod.Delete)
	allowMethod(HttpMethod.Options)
	allowHeader(HttpHeaders.ContentType)
	allowHeader("X-API-Key")
	allowCredentials = true
    }

    // Configure status pages for error handling
    install(StatusPages) {
	exception<Throwable> { call, cause ->
	    call.application.environment.log.error("Unhandled exception", cause)
	    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Internal server error"))
	}
    }

    // Configure serialization and routing
    configureSerialization()
    configureRouting()
}
