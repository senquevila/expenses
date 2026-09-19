import {
  Loan,
  LoanSummary,
  CreateLoanRequest,
  UpdateLoanRequest,
} from "@/_models/loan.model";
import { loanService } from "@/_services/loan.service";
import { createEntityStore } from "./createEntityStore";

export const useLoanStore = createEntityStore<
  Loan,
  LoanSummary,
  CreateLoanRequest,
  UpdateLoanRequest
>(loanService, "Loan", "loan-summary-cache");
