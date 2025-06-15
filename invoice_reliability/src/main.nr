fn main(
    total_invoices: u32,
    paid_invoices: u32,
    threshold_percent: u32,

    total_debt: u64,
    total_income: u64,
    dti_threshold_bp: u64,

    dso: u32,
    dso_threshold: u32,

    ar_over60: u64,
    ar_total: u64,
    ar_pct_threshold_bp: u64,

    revenue12mo: u64,
    revenue_threshold: u64,

    largest_cust_sales: u64,
    total_sales: u64,
    concentration_threshold_bp: u64
) -> pub [bool; 6] {
    // 1. Invoice Reliability
    assert(total_invoices > 0);
    let paid_percent: u32 = (paid_invoices * 100) / total_invoices;
    let reliable: bool = paid_percent >= threshold_percent;

    // 2. DTI
    let dti_pass: bool = if (total_income > 0) {
        ((total_debt * 10_000) / total_income) <= dti_threshold_bp
    } else {
        false
    };

    // 3. DSO
    let dso_pass: bool = dso < dso_threshold;

    // 4. AR > 60 Days
    let pct_over60: u64 = if (ar_total > 0) {
        (ar_over60 * 10_000) / ar_total
    } else {
        0
    };
    let ar_aging_pass: bool = pct_over60 < ar_pct_threshold_bp;

    // 5. Revenue (12mo)
    let revenue_pass: bool = revenue12mo > revenue_threshold;

    // 6. Concentration
    let concentration_pct: u64 = if (total_sales > 0) {
        (largest_cust_sales * 10_000) / total_sales
    } else {
        0
    };
    let concentration_pass: bool = concentration_pct < concentration_threshold_bp;

    [reliable, dti_pass, dso_pass, ar_aging_pass, revenue_pass, concentration_pass]
}
