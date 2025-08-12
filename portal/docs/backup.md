# MongoDB Backup & Restore Checklist

## Automated (Atlas)
- Enable daily snapshots (dev: 7–14 days, prod: 30+)
- Test point-in-time restore quarterly

## Manual Exports
```bash
mongoexport --uri "$MONGODB_URI/$DB_NAME" \
  --collection=transactions \
  --out=transactions.json
```

## Restore
```bash
mongoimport --uri "$MONGODB_URI/$DB_NAME" \
  --collection=transactions \
  --file=transactions.json \
  --jsonArray
```

## Notes
- Store exports in encrypted storage
- Keep restore runbooks; define RTO/RPO
- Rebuild/validate indexes after restore
