"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { StockInRequest } from "./types";
import { useStockInEnhanced } from "./stock-in-context-enhanced";
import { useAuth } from "@/contexts/auth-context";
import { canApprove } from "@/utils/workflow-validation";

interface ApprovalStageProps {
  request: StockInRequest;
  onStatusChange?: () => void;
}

export function ApprovalStage({
  request,
  onStatusChange,
}: ApprovalStageProps) {
  const {
    approveRequest,
    rejectRequest,
    requestModification,
  } = useStockInEnhanced();
  const { currentUser } = useAuth();
  const [rejectionReason, setRejectionReason] = useState("");
  const [modificationNote, setModificationNote] = useState("");
  const [activeTab, setActiveTab] = useState<"review" | "reject" | "modify">(
    "review"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    const result = approveRequest(request.id);
    if (result.success) {
      onStatusChange?.();
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setIsProcessing(true);
    const result = rejectRequest(request.id, rejectionReason);
    if (result.success) {
      onStatusChange?.();
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsProcessing(false);
  };

  const handleModification = async () => {
    if (!modificationNote.trim()) {
      alert("Please provide modification details");
      return;
    }
    setIsProcessing(true);
    const result = requestModification(request.id, modificationNote);
    if (result.success) {
      onStatusChange?.();
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsProcessing(false);
  };

  const canPerformApproval = currentUser && canApprove(currentUser.role);
  const isAlreadyApproved = request.status !== "pending_approval";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          Manager Approval
        </CardTitle>
        <CardDescription>
          Review and approve stock-in request before processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Awaiting Approval</h4>
              <p className="text-sm text-blue-700 mt-1">
                {request.status === "pending_approval"
                  ? "This request is pending manager approval."
                  : `This request has been ${request.status}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Permission Check */}
        {!canPerformApproval && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900">
                Insufficient Permissions
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Your role ({currentUser?.role}) cannot perform approvals. Only
                Admin, Manager, and Approver roles can approve requests.
              </p>
            </div>
          </div>
        )}

        {/* Request Summary */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Request ID</p>
              <p className="font-mono font-semibold">{request.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold capitalize">{request.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Supplier</p>
              <p className="font-semibold">{request.supplierName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">PO Reference</p>
              <p className="font-mono text-sm">{request.purchaseOrderRef}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Product Lines</p>
              <p className="font-semibold">{request.products.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created By</p>
              <p className="text-sm">{request.createdBy}</p>
            </div>
          </div>
        </div>

        {/* Action Tabs */}
        {request.status === "pending_approval" && canPerformApproval && (
          <div className="space-y-4">
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab("review")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "review"
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <CheckCircle className="h-4 w-4 inline mr-2" />
                Approve
              </button>
              <button
                onClick={() => setActiveTab("reject")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "reject"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <XCircle className="h-4 w-4 inline mr-2" />
                Reject
              </button>
              <button
                onClick={() => setActiveTab("modify")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "modify"
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Request Changes
              </button>
            </div>

            {/* Approve Tab */}
            {activeTab === "review" && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-900">
                  Approving this request will automatically generate a GRN
                  (Goods Receipt Note) and move it to the next stage.
                </p>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isProcessing ? "Processing..." : "Approve Request"}
                </Button>
              </div>
            )}

            {/* Reject Tab */}
            {activeTab === "reject" && (
              <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please specify why this request is being rejected..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {isProcessing ? "Processing..." : "Reject Request"}
                </Button>
              </div>
            )}

            {/* Modify Tab */}
            {activeTab === "modify" && (
              <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Modification Request *
                  </label>
                  <textarea
                    value={modificationNote}
                    onChange={(e) => setModificationNote(e.target.value)}
                    placeholder="Describe what changes need to be made to this request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleModification}
                  disabled={isProcessing || !modificationNote.trim()}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isProcessing ? "Processing..." : "Request Modifications"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Already Processed Message */}
        {isAlreadyApproved && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              This request has already been processed and moved to the{" "}
              <span className="font-semibold capitalize">{request.status}</span>{" "}
              stage.
            </p>
            {request.approvedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Approved on {new Date(request.approvedAt).toLocaleString()} by{" "}
                {request.approvedBy}
              </p>
            )}
            {request.rejectedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Rejected on {new Date(request.rejectedAt).toLocaleString()} by{" "}
                {request.rejectedBy}. Reason: {request.rejectionReason}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
