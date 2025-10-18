package com

import com.routes.arcRoutes
import com.routes.characterRoutes
import com.routes.eventRoutes
import com.routes.sagaRoutes
import com.routes.userRoutes
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    routing {
	staticResources("/", "static")

	// API routes
	eventRoutes()
	characterRoutes()
	arcRoutes()
	sagaRoutes()
	userRoutes()
    }
}
