# gtri Demo
# Run: vhs demo.tape

Output demo.gif

Set FontSize 16
Set Width 800
Set Height 600
Set Theme "Catppuccin Mocha"

# Start gtri
Type "./gtri"
Enter
Sleep 2s

# === Worktrees Tab ===

# Navigate down with j
Type "j"
Sleep 0.8s
Type "j"
Sleep 0.8s

# Navigate up with k
Type "k"
Sleep 0.8s

# Copy path to clipboard
Type "c"
Sleep 1.5s

# Copy AI command
Type "a"
Sleep 1.5s

# === Open PRs Tab ===
# Review PRs easily - create worktree with one key

# Switch to Open PRs tab
Tab
Sleep 1.5s

# Navigate PRs
Type "j"
Sleep 0.8s
Type "j"
Sleep 0.8s

# Navigate up
Type "k"
Sleep 0.8s

# Switch back to Worktrees tab
Tab
Sleep 1.5s

# Refresh list
Type "r"
Sleep 1.5s

# Quit
Type "q"
Sleep 1s
