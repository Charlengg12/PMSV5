import { useState, useEffect } from "react";
import { apiService } from "../../utils/apiService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Plus,
  Wallet,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
  CalendarIcon,
  Filter,
  RefreshCcw,
  X,
  CreditCard,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import Swal from "sweetalert2";

export function ClientBilling() {
  const [billingData, setBillingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // -- Filter State --
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectSearch, setProjectSearch] = useState("");

  // -- Modal State --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");

  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // SweetAlert2 custom classes
  const swalCustomClasses = {
    container: "swal-container",
    popup: "swal-popup !max-w-md",
    title: "swal-title",
    htmlContainer: "swal-content",
    confirmButton: "swal-confirm-button",
    cancelButton: "swal-cancel-button",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiService.getBillingSummary();
      if (res.data) {
        setBillingData(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProjectData = billingData.find((p) => p.id === selectedProject);

  const getFilteredData = () => {
    return billingData.filter((item) => {
      const matchesSearch =
        projectSearch.trim() === "" ||
        String(item.title || "")
          .toLowerCase()
          .includes(projectSearch.toLowerCase().trim()) ||
        String(item.client_name || "")
          .toLowerCase()
          .includes(projectSearch.toLowerCase().trim());

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;

      const cost = parseFloat(item.total_cost || 0);
      const paid = parseFloat(item.total_paid || 0);
      const balance = parseFloat(item.balance || 0);

      if (statusFilter === "paid") return balance <= 0 && cost > 0;
      if (statusFilter === "unpaid") return paid === 0;
      if (statusFilter === "partial") return paid > 0 && balance > 0;
      return true;
    });
  };

  const filteredData = getFilteredData();

  const toggleRow = (projectId: string) => {
    setExpandedRows((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const handleAddPayment = async () => {
    // 1. Required fields validation
    if (!selectedProject) {
      await Swal.fire({
        icon: "error",
        title: "Project Required",
        text: "Please select a project to record payment for.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (!amount || amount.trim() === "") {
      await Swal.fire({
        icon: "error",
        title: "Amount Required",
        text: "Please enter the payment amount.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (!date) {
      await Swal.fire({
        icon: "error",
        title: "Date Required",
        text: "Please select the payment date.",
        customClass: swalCustomClasses,
      });
      return;
    }

    // 2. Validate amount is a valid positive number
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Amount",
        text: "Payment amount must be a number greater than 0.",
        customClass: swalCustomClasses,
      });
      return;
    }

    // NEW: Enforce max amount limit of 1,000,000
    if (paymentAmount > 1000000) {
      await Swal.fire({
        icon: "error",
        title: "Amount Exceeds Limit",
        text: "The maximum allowed payment amount is ₱1,000,000.",
        customClass: swalCustomClasses,
      });
      return;
    }

    // 3. Get project data and validate existence
    const project = billingData.find((item) => item.id === selectedProject);
    if (!project) {
      await Swal.fire({
        icon: "error",
        title: "Project Not Found",
        text: "Selected project could not be found. Please try again.",
        customClass: swalCustomClasses,
      });
      return;
    }

    // 4. Check against remaining balance
    const totalCost = parseFloat(project.total_cost || "0");
    const totalPaid = parseFloat(project.total_paid || "0");
    const remainingBalance = totalCost - totalPaid;

    // Prevent overpayment (with small epsilon for floating-point precision)
    if (paymentAmount > remainingBalance + 0.01) {
      await Swal.fire({
        icon: "error",
        title: "Overpayment Detected",
        text: `You cannot pay ${formatMoney(paymentAmount)}. The remaining balance is only ${formatMoney(remainingBalance)}.`,
        customClass: swalCustomClasses,
      });
      return;
    }

    // if reference number is > 20 return the sweet alert

    if (reference.trim().length > 20) {
      await Swal.fire({
        icon: "error",
        title: "Reference Too Long",
        text: "Reference number must be 20 characters or less.",
        customClass: swalCustomClasses,
      });
      return;
    }

    // 5. Confirmation dialog with details
    const confirmResult = await Swal.fire({
      title: "Confirm Payment",
      html: `
        <div class="text-left space-y-2 text-sm">
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Client:</strong> ${project.client_name || "N/A"}</p>
          <p><strong>Amount:</strong> ${formatMoney(paymentAmount)}</p>
          <p><strong>Date:</strong> ${format(new Date(date), "MMM dd, yyyy")}</p>
          <p><strong>Method:</strong> ${method}</p>
          ${reference ? `<p><strong>Reference:</strong> ${reference}</p>` : ""}
          <p class="mt-4 font-medium text-green-600">
            Remaining balance after payment: ${formatMoney(remainingBalance - paymentAmount)}
          </p>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Confirm Payment",
      cancelButtonText: "Cancel",
      customClass: {
        ...swalCustomClasses,
        popup: "swal-popup !max-w-lg",
      },
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    // 6. Show loading state
    Swal.fire({
      title: "Processing Payment...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: swalCustomClasses,
    });

    // Wait exactly 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await apiService.createPayment({
        projectId: selectedProject,
        amount: paymentAmount,
        date,
        method,
        reference,
      });

      await Swal.fire({
        icon: "success",
        title: "Payment Recorded!",
        text: "The payment has been successfully saved.",
        timer: 2200,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });

      setIsModalOpen(false);
      setAmount("");
      setReference("");
      fetchData();
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to record payment. Please try again.",
        customClass: swalCustomClasses,
      });
    } finally {
      Swal.close();
    }
  };

  const handleDeletePayment = async (id: number) => {
    const result = await Swal.fire({
      title: "Delete this payment?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#ef4444",
      customClass: swalCustomClasses,
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Processing...",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: swalCustomClasses,
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        await apiService.deletePayment(id);
        fetchData();
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Payment has been successfully deleted.",
          timer: 1800,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Could not delete payment. Please try again.",
          customClass: swalCustomClasses,
        });
      } finally {
        Swal.close();
      }
    }
  };

  // Totals Calculation
  const totalRevenue = billingData.reduce(
    (sum, item) => sum + parseFloat(item.total_cost || 0),
    0,
  );
  const totalCollected = billingData.reduce(
    (sum, item) => sum + parseFloat(item.total_paid || 0),
    0,
  );
  const totalReceivable = totalRevenue - totalCollected;

  return (
    <div className="flex min-h-screen flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h2 className="text-xl font-bold sm:text-2xl">
            <CreditCard className="mr-2 mb-1 inline-block h-6 w-6 text-orange-400" />
            Client Billing
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage invoices, track payments, and receivables
          </p>
        </div>

        <div className="flex w-full flex-col-reverse items-center gap-3 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            onClick={fetchData}
            className="h-11 w-full shrink-0 rounded-2xl border-[#d9e5f2] bg-white font-semibold text-[#123a68] shadow-sm hover:bg-[#f8fbff] hover:text-[#123a68] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-11 sm:px-0"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            <span className="sm:hidden ml-2">Refresh</span>
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex-1 rounded-2xl bg-[#123a68] shadow-sm hover:bg-[#0f3055] dark:bg-blue-700 dark:hover:bg-blue-600 sm:w-auto sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Record Payment</span>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card className="overflow-hidden rounded-[1.25rem] border border-[#e7edf4] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.045)] dark:border-slate-700 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-0 pt-4">
            <CardTitle className="text-sm font-medium text-[#5b6b82] dark:text-slate-300">
              Total Contract Value
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dbeafe] bg-[#eff6ff] dark:border-slate-700 dark:bg-slate-800">
              <Wallet className="h-4.5 w-4.5 text-[#2563eb]" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4 pt-2">
            <div
              className="truncate text-[1.45rem] font-bold leading-none tracking-[-0.03em] text-[#0f172a] dark:text-white"
              title={formatMoney(totalRevenue)}
            >
              {formatMoney(totalRevenue)}
            </div>
            <p className="mt-2 text-sm leading-5 text-[#6b7b93] dark:text-slate-400">
              Across all active projects
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[1.25rem] border border-[#e7edf4] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.045)] dark:border-slate-700 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-0 pt-4">
            <CardTitle className="text-sm font-medium text-[#5b6b82] dark:text-slate-300">
              Total Collected
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dff6e8] bg-[#f2fcf6] dark:border-slate-700 dark:bg-slate-800">
              <TrendingUp className="h-4.5 w-4.5 text-green-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4 pt-2">
            <div
              className="truncate text-[1.45rem] font-bold leading-none tracking-[-0.03em] text-green-600 dark:text-emerald-400"
              title={formatMoney(totalCollected)}
            >
              {formatMoney(totalCollected)}
            </div>
            <p className="mt-2 text-sm leading-5 text-[#6b7b93] dark:text-slate-400">
              {totalRevenue > 0
                ? ((totalCollected / totalRevenue) * 100).toFixed(1)
                : 0}
              % of total value
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[1.25rem] border border-[#e7edf4] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.045)] dark:border-slate-700 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-0 pt-4">
            <CardTitle className="text-sm font-medium text-[#5b6b82] dark:text-slate-300">
              Outstanding Balance
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#fee2e2] bg-[#fff5f5] dark:border-slate-700 dark:bg-slate-800">
              <AlertCircle className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4 pt-2">
            <div
              className="truncate text-[1.45rem] font-bold leading-none tracking-[-0.03em] text-red-600 dark:text-red-400"
              title={formatMoney(totalReceivable)}
            >
              {formatMoney(totalReceivable)}
            </div>
            <p className="mt-2 text-sm leading-5 text-[#6b7b93] dark:text-slate-400">
              Pending collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden rounded-[1.75rem] border border-[#e7edf4] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
        <CardHeader className="border-b border-[#edf2f7] px-6 py-5 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-[#123a68] dark:text-white">Project Accounts</CardTitle>
              <CardDescription className="mt-1 text-[#6b7b93] dark:text-slate-400">
                Click on a row to view detailed payment history.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <div className="relative w-full sm:w-[260px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-slate-400" />
                <Input
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search Project..."
                  className="h-11 rounded-2xl border-[#d9e5f2] bg-white pl-11 text-[#123a68] shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="w-full sm:w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 rounded-2xl border-[#d9e5f2] bg-white text-[#123a68] shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                      <SelectValue placeholder="Filter by status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                    <SelectItem value="paid">Fully Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto p-5">
            <Table>
              <TableHeader className="bg-[#123a68] [&_tr]:border-[#123a68]">
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="min-w-[220px] px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Project / Client
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white">Status</TableHead>
                  <TableHead className="px-4 py-4 text-right whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Total Cost
                  </TableHead>
                  <TableHead className="px-4 py-4 text-right whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Paid
                  </TableHead>
                  <TableHead className="px-4 py-4 text-right whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Balance
                  </TableHead>
                  <TableHead className="w-[180px] min-w-[150px] px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Payment Progress
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-14 text-center text-muted-foreground dark:text-slate-400"
                    >
                      Loading financial data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-14 text-center text-muted-foreground dark:text-slate-400"
                    >
                      No projects found matching that filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => {
                    const cost = parseFloat(item.total_cost || 0);
                    const paid = parseFloat(item.total_paid || 0);
                    const balance = parseFloat(item.balance || 0);
                    const percent = cost > 0 ? (paid / cost) * 100 : 0;
                    const isFullyPaid = balance <= 0 && cost > 0;
                    const isExpanded = expandedRows.includes(item.id);

                    return (
                      <>
                        <TableRow
                          key={item.id}
                          className={`cursor-pointer border-[#edf2f7] transition-colors dark:border-slate-800 ${isExpanded ? "bg-[#f7fbff] dark:bg-slate-800/70" : "hover:bg-[#f9fbfe] dark:hover:bg-slate-800/40"}`}
                          onClick={() => toggleRow(item.id)}
                        >
                          <TableCell className="pl-4">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#123a68] dark:text-white">
                                {item.title}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground dark:text-slate-400">
                                {item.client_name || "Unknown Client"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isFullyPaid ? (
                              <Badge
                                variant="default"
                                className="border-green-200 bg-green-600/15 text-green-700 shadow-none hover:bg-green-600/25 dark:border-green-900 dark:bg-green-950/60 dark:text-green-300"
                              >
                                Fully Paid
                              </Badge>
                            ) : paid > 0 ? (
                              <Badge
                                variant="secondary"
                                className="border-blue-200 bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                              >
                                Partial
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              >
                                Unpaid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-medium dark:text-slate-200">
                            {formatMoney(cost)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-medium text-green-600 dark:text-emerald-400">
                            {formatMoney(paid)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-medium text-red-600 dark:text-red-400">
                            {formatMoney(balance)}
                          </TableCell>
                          <TableCell className="pr-6">
                            <div className="flex items-center gap-3">
                              <Progress
                                value={percent}
                                className="h-2.5 w-full bg-[#dbeafe] dark:bg-slate-800"
                              />
                              <span className="w-9 text-right text-xs font-medium text-muted-foreground dark:text-slate-400">
                                {Math.min(Math.round(percent), 100)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* EXPANDED HISTORY ROW */}
                        {isExpanded && (
                          <TableRow className="border-t-0 bg-[#f8fbfe] shadow-inner hover:bg-[#f8fbfe] dark:bg-slate-950/70 dark:hover:bg-slate-950/70">
                            <TableCell colSpan={7} className="p-0">
                              <div className="py-4 px-4 md:pl-14 md:pr-4 overflow-x-auto">
                                <div className="rounded-[1.25rem] border border-[#e7edf4] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                  <div className="flex items-center justify-between border-b border-[#edf2f7] bg-[#f8fbfe] p-4 dark:border-slate-800 dark:bg-slate-950">
                                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:text-slate-400">
                                      Transaction History
                                    </h4>
                                    <span className="text-xs text-muted-foreground dark:text-slate-500">
                                      ID: {item.id}
                                    </span>
                                  </div>
                                  {item.payment_history &&
                                  item.payment_history.length > 0 ? (
                                    <Table>
                                      <TableHeader className="bg-[#123a68] [&_tr]:border-[#123a68]">
                                        <TableRow className="hover:bg-transparent">
                                          <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-[0.14em] !text-white">
                                            Date
                                          </TableHead>
                                          <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-[0.14em] !text-white">
                                            Method
                                          </TableHead>
                                          <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-[0.14em] !text-white">
                                            Reference
                                          </TableHead>
                                          <TableHead className="h-10 px-4 text-right text-xs font-semibold uppercase tracking-[0.14em] !text-white">
                                            Amount
                                          </TableHead>
                                          <TableHead className="h-10 w-[50px] px-4 text-right text-xs font-semibold uppercase tracking-[0.14em] !text-white"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {item.payment_history.map(
                                          (hist: any) => (
                                            <TableRow
                                              key={hist.id}
                                              className="h-11 border-[#edf2f7] hover:bg-[#f8fbfe] dark:border-slate-800 dark:hover:bg-slate-800/40"
                                            >
                                              <TableCell className="whitespace-nowrap py-2 text-sm dark:text-slate-200">
                                                <div className="flex items-center gap-2">
                                                  <CalendarIcon className="h-3 w-3 text-muted-foreground dark:text-slate-400" />
                                                  {format(
                                                    new Date(hist.payment_date),
                                                    "MMM d, yyyy",
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell className="py-2 text-sm dark:text-slate-200">
                                                {hist.method}
                                              </TableCell>
                                              <TableCell className="py-2 text-sm font-mono text-muted-foreground dark:text-slate-400">
                                                {hist.reference || "-"}
                                              </TableCell>
                                              <TableCell className="py-2 text-right text-sm font-medium dark:text-slate-200">
                                                {formatMoney(
                                                  parseFloat(hist.amount),
                                                )}
                                              </TableCell>
                                              <TableCell className="py-2 text-right">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePayment(
                                                      hist.id,
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ),
                                        )}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                      <Wallet className="mb-2 h-8 w-8 text-muted-foreground/30 dark:text-slate-600" />
                                      <p className="text-sm text-muted-foreground dark:text-slate-400">
                                        No payment records found.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CUSTOM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="modal mx-4 w-full max-w-lg overflow-hidden rounded-[1.6rem] border border-[#e5edf5] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-slate-700 dark:bg-slate-950 sm:mx-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#edf2f7] p-6 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-semibold text-[#123a68] dark:text-white">Record New Payment</h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                  Enter the payment details below.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 rounded-2xl text-[#5b6b82] hover:bg-[#f5f8fc] hover:text-[#123a68] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Project Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-[#123a68] dark:text-slate-200">
                  Select Project
                </label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger className="h-11 w-full rounded-2xl border-[#d9e5f2] bg-white text-[#123a68] shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Search or select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {billingData.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-medium">{p.title}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({p.client_name})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-[#123a68] dark:text-slate-200">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground dark:text-slate-400">
                      ₱
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={1000000}
                      step="0.01"
                      className="h-11 rounded-2xl border-[#d9e5f2] bg-white pl-7 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  {selectedProjectData && (
                    <p className="mt-1 text-right text-[11px] text-muted-foreground dark:text-slate-400">
                      Max allowed:{" "}
                      <span className="font-medium text-foreground dark:text-slate-200">
                        {formatMoney(
                          Math.min(
                            parseFloat(selectedProjectData.total_cost) -
                              parseFloat(selectedProjectData.total_paid),
                            1000000,
                          ),
                        )}
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-[#123a68] dark:text-slate-200">
                    Date Received
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-11 rounded-2xl border-[#d9e5f2] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Method & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-[#123a68] dark:text-slate-200">
                    Payment Method
                  </label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="h-11 rounded-2xl border-[#d9e5f2] bg-white text-[#123a68] shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="GCash">GCash</SelectItem>
                      <SelectItem value="Maya">Maya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-[#123a68] dark:text-slate-200">
                    Reference No. (Optional)
                  </label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. Check #12345"
                    className="h-11 rounded-2xl border-[#d9e5f2] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[#edf2f7] bg-[#f8fbfe] px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border-[#d9e5f2] bg-white font-semibold text-[#123a68] hover:bg-[#f8fbff] hover:text-[#123a68] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPayment}
                className="rounded-2xl bg-[#123a68] hover:bg-[#0f3055] dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Save Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
