import { useState, useEffect } from "react";
import { apiService } from "../../utils/apiService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
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
  X
} from "lucide-react";
import { format } from "date-fns";
import Swal from "sweetalert2";

export function ClientBilling() {
  const [billingData, setBillingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // -- Filter State --
  const [statusFilter, setStatusFilter] = useState("all"); 

  // -- Modal State --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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

  const selectedProjectData = billingData.find(p => p.id === selectedProject);

  const getFilteredData = () => {
    if (statusFilter === "all") return billingData;

    return billingData.filter((item) => {
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
    setExpandedRows(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
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
    await new Promise(resolve => setTimeout(resolve, 2000));

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

        await new Promise(resolve => setTimeout(resolve, 2000));

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
  const totalRevenue = billingData.reduce((sum, item) => sum + parseFloat(item.total_cost || 0), 0);
  const totalCollected = billingData.reduce((sum, item) => sum + parseFloat(item.total_paid || 0), 0);
  const totalReceivable = totalRevenue - totalCollected;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 bg-muted/40 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Client Billing</h2>
          <p className="text-muted-foreground mt-1">
            Manage project invoices, track payments, and monitor receivables.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon" onClick={fetchData} className="shrink-0">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="shadow-sm border-l-[6px] border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pl-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contract Value</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pl-6 pb-6">
            <div className="text-xl sm:text-2xl font-bold truncate" title={formatMoney(totalRevenue)}>
              {formatMoney(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all active projects</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-l-[6px] border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pl-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pl-6 pb-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600 truncate" title={formatMoney(totalCollected)}>
              {formatMoney(totalCollected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : 0}% of total value
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-[6px] border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pl-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pl-6 pb-6">
            <div className="text-xl sm:text-2xl font-bold text-red-600 truncate" title={formatMoney(totalReceivable)}>
              {formatMoney(totalReceivable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-card px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Project Accounts</CardTitle>
              <CardDescription>Click on a row to view detailed payment history.</CardDescription>
            </div>
            
            {/* Status Filter */}
            <div className="w-full sm:w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
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
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto p-5">
            <Table>
              <TableHeader className="bg-muted/50 ">
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="min-w-[200px] text-white">Project / Client</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap text-white">Total Cost</TableHead>
                  <TableHead className="text-right whitespace-nowrap text-white">Paid</TableHead>
                  <TableHead className="text-right whitespace-nowrap text-white">Balance</TableHead>
                  <TableHead className="w-[180px] min-w-[150px] text-white">Payment Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading financial data...</TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No projects found matching that filter.</TableCell></TableRow>
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
                          className={`cursor-pointer transition-colors ${isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30'}`} 
                          onClick={() => toggleRow(item.id)}
                        >
                          <TableCell className="pl-4">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{item.title}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {item.client_name || "Unknown Client"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isFullyPaid ? (
                              <Badge variant="default" className="bg-green-600/15 text-green-700 hover:bg-green-600/25 border-green-200 shadow-none">Fully Paid</Badge>
                            ) : paid > 0 ? (
                              <Badge variant="secondary" className="bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 border-blue-200">Partial</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Unpaid</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">{formatMoney(cost)}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium whitespace-nowrap">{formatMoney(paid)}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium whitespace-nowrap">{formatMoney(balance)}</TableCell>
                          <TableCell className="pr-6">
                            <div className="flex items-center gap-3">
                              <Progress value={percent} className="h-2 w-full" indicatorColor={isFullyPaid ? "bg-green-600" : ""} />
                              <span className="text-xs font-medium text-muted-foreground w-9 text-right">{Math.min(Math.round(percent), 100)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* EXPANDED HISTORY ROW */}
                        {isExpanded && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30 border-t-0 shadow-inner">
                            <TableCell colSpan={7} className="p-0">
                              <div className="py-4 px-4 md:pl-14 md:pr-4 overflow-x-auto">
                                <div className="bg-card rounded-lg border shadow-sm">
                                  <div className="flex items-center justify-between p-3 border-b bg-muted/20">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction History</h4>
                                    <span className="text-xs text-muted-foreground">ID: {item.id}</span>
                                  </div>
                                  {item.payment_history && item.payment_history.length > 0 ? (
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                          <TableHead className="h-9 text-xs text-white">Date</TableHead>
                                          <TableHead className="h-9 text-xs text-white">Method</TableHead>
                                          <TableHead className="h-9 text-xs text-white">Reference</TableHead>
                                          <TableHead className="h-9 text-xs text-white text-right">Amount</TableHead>
                                          <TableHead className="h-9 text-xs text-white text-right w-[50px]"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {item.payment_history.map((hist: any) => (
                                          <TableRow key={hist.id} className="h-10 hover:bg-muted/20">
                                            <TableCell className="py-2 text-sm whitespace-nowrap">
                                              <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                                {format(new Date(hist.payment_date), "MMM d, yyyy")}
                                              </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-sm">{hist.method}</TableCell>
                                            <TableCell className="py-2 text-sm font-mono text-muted-foreground">{hist.reference || "-"}</TableCell>
                                            <TableCell className="py-2 text-sm text-right font-medium">{formatMoney(parseFloat(hist.amount))}</TableCell>
                                            <TableCell className="py-2 text-right">
                                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePayment(hist.id);
                                              }}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                      <Wallet className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                      <p className="text-sm text-muted-foreground">No payment records found.</p>
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
          <div className="modal bg-card w-full max-w-lg mx-4 sm:mx-6 rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">Record New Payment</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the payment details below.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Project Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Select Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Search or select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {billingData.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-medium">{p.title}</span> 
                        <span className="text-muted-foreground ml-2 text-xs">({p.client_name})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">₱</span>
                    <Input 
                      type="number"
                      min={0}
                      max={1000000}
                      step="0.01"
                      className="pl-7"
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00" 
                    />
                  </div>
                  {selectedProjectData && (
                    <p className="text-[11px] text-muted-foreground text-right mt-1">
                      Max allowed: <span className="font-medium text-foreground">
                        {formatMoney(Math.min(
                          parseFloat(selectedProjectData.total_cost) - parseFloat(selectedProjectData.total_paid),
                          1000000
                        ))}
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Date Received</label>
                  <Input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                  />
                </div>
              </div>

              {/* Method & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Payment Method</label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="GCash">GCash</SelectItem>
                      <SelectItem value="Maya">Maya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Reference No. (Optional)</label>
                  <Input 
                    value={reference} 
                    onChange={(e) => setReference(e.target.value)} 
                    placeholder="e.g. Check #12345" 
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/40">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddPayment}
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