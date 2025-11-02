package com

import com.config.configureDatabases
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.metrics.micrometer.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.util.*
import io.micrometer.prometheusmetrics.PrometheusConfig
import io.micrometer.prometheusmetrics.PrometheusMeterRegistry

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
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
