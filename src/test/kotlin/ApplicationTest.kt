package com

import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.config.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals

class ApplicationTest {

    @Test
    fun testRoot() = testApplication {
        environment {
            config = MapApplicationConfig(
                "mongodb.uri" to "mongodb://localhost:27017",
                "mongodb.database" to "one_piece_timeline_test"
            )
        }
        application {
            module()
        }
        client.get("/api/events").apply {
            assertEquals(HttpStatusCode.OK, status)
        }
    }

}
