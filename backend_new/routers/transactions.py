"""Transactions router — /api/transactions/*"""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from middleware.auth import get_current_customer
from services.banking_service import BankingService, BankingError
from models.user import User
from models.account import Account
from models.transaction import Transaction
from models.fraud_alert import FraudAlert

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("")
def list_transactions(
    page: int = 1, per_page: int = 20, type: str = "all", status: str = "all",
    current_user: User = Depends(get_current_customer), db: Session = Depends(get_db),
):
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="No account found.")
    try:
        return BankingService(db).get_transactions(account.id, current_user.id, page, per_page, type, status)
    except BankingError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{txn_id}")
def get_transaction(txn_id: str, current_user: User = Depends(get_current_customer),
                    db: Session = Depends(get_db)):
    try:
        txn = BankingService(db).get_transaction_detail(txn_id, current_user.id)
        d = txn.to_dict()
        # Include fraud alert if exists
        alert = db.query(FraudAlert).filter(FraudAlert.transaction_id == txn_id).first()
        if alert:
            d["fraud_alert"] = alert.to_dict()
        return {"transaction": d}
    except BankingError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/statement/download")
def download_statement(
    from_date: str, to_date: str, format: str = "csv",
    current_user: User = Depends(get_current_customer), db: Session = Depends(get_db),
):
    """Download account statement as CSV or PDF."""
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="No account found.")

    try:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    txns = db.query(Transaction).filter(
        Transaction.account_id == account.id,
        Transaction.created_at >= from_dt,
        Transaction.created_at <= to_dt,
    ).order_by(Transaction.created_at.asc()).all()

    if format == "csv":
        import io, csv as csv_mod
        output = io.StringIO()
        writer = csv_mod.writer(output)
        writer.writerow(["Date", "Transaction ID", "Description", "Type", "Amount", "Balance After", "Status"])
        for t in txns:
            writer.writerow([
                t.created_at.strftime("%Y-%m-%d %H:%M"),
                t.transaction_id,
                t.description,
                t.type,
                f"{'+' if t.type in ('deposit','transfer_in','interest') else '-'}₹{t.amount:,.2f}",
                f"₹{t.balance_after:,.2f}",
                t.status,
            ])
        content = output.getvalue().encode()
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=statement_{from_date}_to_{to_date}.csv"},
        )
    else:
        # PDF via reportlab
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib import colors
            import io

            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=A4)
            styles = getSampleStyleSheet()
            elements = []

            elements.append(Paragraph("Global Digital Bank", styles["Title"]))
            elements.append(Paragraph(f"Account Statement: {from_date} to {to_date}", styles["Normal"]))
            elements.append(Paragraph(f"Account: {account.masked_number()} | {account.account_type.capitalize()}", styles["Normal"]))
            elements.append(Spacer(1, 12))

            data = [["Date", "ID", "Description", "Type", "Amount (₹)", "Balance (₹)", "Status"]]
            for t in txns:
                sign = "+" if t.type in ("deposit", "transfer_in", "interest") else "-"
                data.append([
                    t.created_at.strftime("%d %b %Y"),
                    t.transaction_id,
                    t.description[:30],
                    t.type.replace("_", " ").title(),
                    f"{sign}{t.amount:,.2f}",
                    f"{t.balance_after:,.2f}",
                    t.status.title(),
                ])

            table = Table(data, repeatRows=1)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a56db")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
            ]))
            elements.append(table)
            doc.build(elements)

            return Response(
                content=buf.getvalue(),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=statement_{from_date}_to_{to_date}.pdf"},
            )
        except ImportError:
            raise HTTPException(status_code=400, detail="PDF generation requires reportlab. Use CSV format.")
