/* eslint-disable @typescript-eslint/naming-convention */
const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {

  const ExportLogsButton = document.getElementById("export_logs");
  ExportLogsButton.addEventListener("click", ExportLogsClick);

  const SearchTextBox = document.getElementById("search_text");
  SearchTextBox.addEventListener("keydown", SearchTextBoxKeyDown);

  const FilterTextBox = document.getElementById("filter_text");
  FilterTextBox.addEventListener("keydown", FilterTextBoxKeyDown);

  const HideTextBox = document.getElementById("hide_text");
  HideTextBox.addEventListener("keydown", HideTextBoxKeyDown);


  const RefreshButton = document.getElementById("refresh");
  RefreshButton.addEventListener("click", RefreshButtonClick);

}

function RefreshButtonClick() {
  const SearchTextBox = document.getElementById("search_text");
  const FilterTextBox = document.getElementById("filter_text");
  const HideTextBox = document.getElementById("hide_text");
  vscode.postMessage({
    command: "refresh",
    filter_text: FilterTextBox._value,
    hide_text: HideTextBox._value,
    search_text: SearchTextBox._value
  });
}

function PauseTimerClick() {
  vscode.postMessage({
    command: "pause_timer"
  });
}

function ExportLogsClick() {
  vscode.postMessage({
    command: "export_logs"
  });
}

function FilterTextBoxKeyDown(e) {
  if (e.key === "Enter") {
    RefreshButtonClick();
  }
}

function SearchTextBoxKeyDown(e) {
  if (e.key === "Enter") {
    RefreshButtonClick();
  }
}

function HideTextBoxKeyDown(e) {
  if (e.key === "Enter") {
    RefreshButtonClick();
  }
}