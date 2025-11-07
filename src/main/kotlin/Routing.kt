package com

import com.routes.arcRoutes
import com.routes.characterRoutes
import com.routes.eraRoutes
import com.routes.eventRoutes
import com.routes.locationRoutes
import com.routes.sagaRoutes
import com.routes.userRoutes
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.openapi.*
import io.ktor.server.plugins.swagger.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.util.*
import io.micrometer.prometheusmetrics.PrometheusMeterRegistry

fun Application.configureRouting() {
    routing {
	// Prometheus metrics endpoint
	get("/metrics") {
	    val registry = application.attributes[AttributeKey<PrometheusMeterRegistry>("prometheus.registry")]
	    call.respondText(registry.scrape())
	}

	// OpenAPI spec endpoint
	openAPI(path = "openapi", swaggerFile = "openapi/documentation.yaml")

	// Swagger UI for interactive API documentation
	swaggerUI(path = "swagger", swaggerFile = "openapi/documentation.yaml")

	// Serve frontend files from static/dist
	staticResources("/", "static/dist")

	// API routes
	eventRoutes()
	characterRoutes()
	locationRoutes()
	arcRoutes()
	sagaRoutes()
	eraRoutes()
	userRoutes()
    }
}
