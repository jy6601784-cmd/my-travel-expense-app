# 自動更新設定

這個 App 是靜態網站，放到 GitHub 後可以透過 GitHub Pages 自動發佈。

## 第一次在自己電腦設定

1. 安裝 GitHub Desktop，並登入你的 GitHub 帳號。
2. 用 GitHub Desktop 開啟這個資料夾：
   `/Users/wingwing/Documents/Codex/2026-05-09/https-jy6601784-cmd-github-io-my/app`
3. 在 GitHub repo 的 `Settings` -> `Pages` 裡，把 `Source` 改成 `GitHub Actions`。
4. 之後只要把修改推送到 `main`，GitHub 會自動更新網站：
   `https://jy6601784-cmd.github.io/my-travel-expense-app/`

## 日常更新

最簡單的方法是用 GitHub Desktop：

1. 修改 App 檔案。
2. 在 GitHub Desktop 左下角填一句更新說明。
3. 按 `Commit to main`。
4. 按 `Push origin`。

如果你想用一鍵方式，可以直接執行 `publish.command`。它會自動把目前修改 commit 並 push 到 GitHub。

## 注意

App 內的記帳資料目前是存在瀏覽器本機，不會自動同步到 Google Drive 或 GitHub。GitHub Pages 自動更新的是 App 程式本身，不是每個人的私人記帳資料。
