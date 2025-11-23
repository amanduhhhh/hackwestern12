# Table Component Mapping

## Data → Component Example

### API Response (finance::recent_transactions)

```python
[
    {"date": "2024-01-15", "merchant": "Whole Foods", "category": "Food & Dining", "amount": 67.84, "status": "completed"},
    {"date": "2024-01-14", "merchant": "Uber", "category": "Transportation", "amount": 23.50, "status": "completed"},
    {"date": "2024-01-14", "merchant": "Amazon", "category": "Shopping", "amount": 142.99, "status": "completed"},
]
```

### Generated HTML

```html
<component-slot
  type="Table"
  data-source="finance::recent_transactions"
  config='{"template":{"columns":["date","merchant","amount","status"]}}'
  click-prompt="Show transaction details and related spending"
></component-slot>
```

### Rendered Output

| Date       | Merchant    | Amount | Status    |
|------------|-------------|--------|-----------|
| 2024-01-15 | Whole Foods | 67.84  | completed |
| 2024-01-14 | Uber        | 23.50  | completed |
| 2024-01-14 | Amazon      | 142.99 | completed |

## How It Maps

1. `data-source` → fetches array from data context
2. `template.columns` → specifies which fields to display (order matters)
3. If `columns` omitted → infers all fields from first row (minus `id`)
4. Column headers auto-format: `billing_date` → "Billing Date"

## When to Use Table vs List

- **Table**: Multiple comparable fields (transactions, tasks, stats breakdown)
- **List**: Simple primary/secondary display (songs, books, items)
