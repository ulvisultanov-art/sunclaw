package ai.sunclaw.app.ui

import ai.sunclaw.app.MainViewModel
import ai.sunclaw.app.ui.chat.ChatSheetContent
import androidx.compose.runtime.Composable

/** Keeps the public shell entry point stable while chat internals live under ui.chat. */
@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
