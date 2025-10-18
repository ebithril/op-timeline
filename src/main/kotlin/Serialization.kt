package com

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.contextual
import org.bson.types.ObjectId
import kotlinx.serialization.KSerializer
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

object ObjectIdSerializer : KSerializer<ObjectId> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("ObjectId", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: ObjectId) = encoder.encodeString(value.toHexString())
    override fun deserialize(decoder: Decoder): ObjectId = ObjectId(decoder.decodeString())
}

object ObjectIdListSerializer : KSerializer<List<ObjectId>> {
    private val listSerializer = ListSerializer(ObjectIdSerializer)
    override val descriptor: SerialDescriptor = listSerializer.descriptor
    override fun serialize(encoder: Encoder, value: List<ObjectId>) = listSerializer.serialize(encoder, value)
    override fun deserialize(decoder: Decoder): List<ObjectId> = listSerializer.deserialize(decoder)
}

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            serializersModule = SerializersModule {
                contextual(ObjectIdSerializer)
            }
            ignoreUnknownKeys = true
            encodeDefaults = true
        })
    }
    routing {
        get("/json/kotlinx-serialization") {
            call.respond(mapOf("hello" to "world"))
        }
    }
}
