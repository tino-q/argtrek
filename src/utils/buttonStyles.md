# Button Styling Guidelines

## Standard Primary Button Pattern

All primary buttons throughout the application should follow this consistent pattern:

### CSS Pattern

```css
.button-name {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 18px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 10px 25px var(--shadow-primary);
}

.button-name:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px var(--shadow-primary-strong);
  background: var(--gradient-hover);
}

.button-name:active {
  transform: translateY(-1px);
}

.button-name:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
```

### Key Elements

- **Background**: `var(--gradient-primary)` → `var(--gradient-hover)` on hover
- **Shadow**: `0 10px 25px var(--shadow-primary)` → `0 15px 35px var(--shadow-primary-strong)` on hover
- **Transform**: `translateY(-3px)` on hover
- **Transition**: `all 0.3s ease`
- **Border radius**: `12px`
- **Padding**: `18px 40px`

### Examples in Codebase

- `.submit-btn` in `Form.css`
- `.action-button.primary` in `WelcomeSection.css`
- `.login-btn` in `EmailLogin.css`

### CSS Variables Used

- `--gradient-primary`: Default button background
- `--gradient-hover`: Hover state background
- `--shadow-primary`: Default shadow
- `--shadow-primary-strong`: Hover shadow

All variables are defined in `globals.css`.
