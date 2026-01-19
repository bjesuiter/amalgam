# Agents

## Project Conventions

- **Package Manager**: bun (use `bun` instead of `npm` or `pnpm`)

## Documentation References

This project includes documentation for the following protocols and tools:

### ACP (Agent Control Protocol)
- Location: `docs/acp/`
- Overview, protocol specifications, and TypeScript library documentation

### exe.dev
- Location: `docs/exe/all.md`
- Complete exe.dev documentation

### TanStack
- Location: `docs/tanstack/llms.txt`
- TanStack ecosystem documentation (Router, Query, Start, etc.)

## Browser Testing with Playwriter

When available, use the **playwriter MCP server** to visually inspect and test changes in the browser:

- Use `mcp_playwriter_execute` to control the browser via Playwright code snippets
- Take screenshots with `screenshotWithAccessibilityLabels({ page })` to verify UI changes
- Use `accessibilitySnapshot({ page })` to understand page structure and find elements
- Interact with elements using `aria-ref` locators from the accessibility snapshot

**Fallback**: If playwriter is not available, use the `agent-browser` skill instead:
- Load the skill with `/agent-browser` 
- Provides similar browser automation capabilities

This is especially useful for:
- Verifying frontend changes render correctly
- Testing user flows end-to-end
- Debugging layout/styling issues
- Taking screenshots for documentation

## Default Ralp-Loop Prompt 
Get the most important ticket from your perspective from beans and work on it. Work ONLY on this one ticket. 
If you realize you need to do another thing, create a new ticket for this. 
When you finish a ticket successfully, mark the ticket as done in beans and Commit and Push afterwards. 
You're done when all tickets are implemented.
