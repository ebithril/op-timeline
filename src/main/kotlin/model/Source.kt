package com.model

import kotlinx.serialization.Serializable

enum class SourceType {
	VivreCard, Chapter, SBS, DataBook
}

@Serializable
data class Source(
	val sourceType: SourceType,
	val notes: String? = null,
	val isPrimary: Boolean = false,
	val url: String? = null,
	val chapter: Int? = null,
	val page: Int? = null
)
