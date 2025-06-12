// src/main.nr
// Invoice Reliability ZK Proof Demo

// Inputs:
// - total_invoices: total number of invoices
// - paid_invoices: number of invoices actually paid
// - threshold_percent: the minimum percent paid (e.g., 80 means 80% must be paid)
// Output: pub is_reliable (bool, required for Noir)

fn main(total_invoices: u32, paid_invoices: u32, threshold_percent: u32) -> pub bool {
    assert(total_invoices > 0);
    let paid_percent = (paid_invoices * 100) / total_invoices;
    let is_reliable = paid_percent >= threshold_percent;
    is_reliable
}


