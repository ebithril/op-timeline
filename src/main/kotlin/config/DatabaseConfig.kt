package com.config

import com.mongodb.kotlin.client.coroutine.MongoClient
import com.mongodb.kotlin.client.coroutine.MongoDatabase
import io.ktor.server.application.*

object DatabaseConfig {
	private var client: MongoClient? = null
	private var database: MongoDatabase? = null

	fun init(uri: String, databaseName: String) {
		client = MongoClient.create(uri)
		database = client?.getDatabase(databaseName)
	}

	fun getDatabase(): MongoDatabase {
		return database ?: throw IllegalStateException("Database not initialized")
	}

	fun close() {
		client?.close()
	}
}

fun Application.configureDatabases() {
	val uri = environment.config.property("mongodb.uri").getString()
	val databaseName = environment.config.property("mongodb.database").getString()

	DatabaseConfig.init(uri, databaseName)

	environment.monitor.subscribe(ApplicationStopped) {
		DatabaseConfig.close()
	}
}
