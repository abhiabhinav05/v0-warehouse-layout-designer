"use client";

import React, { useState } from "react";
import { StockInRequest } from "./types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  FileText,
  Package,
  Truck,
  ClipboardCheck,
  MapPin,
  CheckCheck,
} from "lucide-react";
import { ApprovalStage } from "./approval-stage";

interface RequestDetailEnhancedProps {
  request: StockInRequest;
  onStatusChange?: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  grn_generated: "bg-purple-100 text-purple-800",
  vehicle_entered: "bg-indigo-100 text-indigo-800",
  unloading_inspection: "bg-orange-100 text-orange-800",
  put_away: "bg-green-100 text-green-800",
  vehicle_exited: "bg-cyan-100 text-cyan-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  modification_requested: "bg-amber-100 text-amber-800",
  partially_completed: "bg-lime-100 text-lime-800",
};

const WORKFLOW_STAGES = [
  { stage: "pending_approval", label: "Pending Approval", icon: CheckCircle },
  { stage: "approved", label: "Approved", icon: CheckCircle },
  { stage: "grn_generated", label: "GRN Generated", icon: FileText },
  { stage: "vehicle_entered", label: "Vehicle Entered", icon: Truck },
  { stage: "unloading_inspection", label: "Inspection", icon: ClipboardCheck },
  { stage: "put_away", label: "Put-Away", icon: MapPin },
  { stage: "vehicle_exited", label: "Vehicle Exit", icon: Truck },
  { stage: "completed", label: "Completed", icon: CheckCheck },
];

export function RequestDetailEnhanced({
  request,
  onStatusChange,
}: RequestDetailEnhancedProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStatusChange = () => {
    setRefreshKey((prev) => prev + 1);
    onStatusChange?.();
  };

  const getCurrentStageIndex = () => {
    return WORKFLOW_STAGES.findIndex((s) => s.stage === request.status);
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">
                Stock-In Request #{request.id.slice(0, 6).toUpperCase()}
              </CardTitle>
              <CardDescription>
                PO: {request.purchaseOrderRef} | Supplier: {request.supplierName}
              </CardDescription>
            </div>
            <Badge className={STAGE_COLORS[request.status]}>
              {request.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Request ID</p>
              <p className="font-mono font-semibold">{request.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">GRN Number</p>
              <p className="font-mono font-semibold">
                {request.grnNumber || "Not Yet Generated"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expected Delivery</p>
              <p className="font-semibold">{request.expectedDeliveryDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="font-semibold">{request.products.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {WORKFLOW_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const Icon = stage.icon;

              return (
                <React.Fragment key={stage.stage}>
                  <div className="flex flex-col items-center gap-2 min-w-max">
                    <div
                      className={`rounded-full p-3 ${
                        isCompleted
                          ? "bg-green-100 text-green-700"
                          : isCurrent
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-center font-medium max-w-[80px]">
                      {stage.label}
                    </span>
                  </div>
                  {index < WORKFLOW_STAGES.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-1 rounded ${
                        isCompleted ? "bg-green-300" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-3">
                    Supplier Information
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-600 text-sm">Name:</span>{" "}
                      <span className="font-medium">{request.supplierName}</span>
                    </p>
                    <p>
                      <span className="text-gray-600 text-sm">Contact:</span>{" "}
                      <span className="font-medium">
                        {request.supplierContact}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600 text-sm">PO Reference:</span>{" "}
                      <span className="font-mono text-sm">
                        {request.purchaseOrderRef}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-3">
                    Metadata
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-600 text-sm">Created By:</span>{" "}
                      <span className="font-medium">{request.createdBy}</span>
                    </p>
                    <p>
                      <span className="text-gray-600 text-sm">Created At:</span>{" "}
                      <span className="font-mono text-sm">
                        {new Date(request.createdAt).toLocaleString()}
                      </span>
                    </p>
                    {request.approvedBy && (
                      <p>
                        <span className="text-gray-600 text-sm">
                          Approved By:
                        </span>{" "}
                        <span className="font-medium">{request.approvedBy}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {request.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900">
                    Rejection Reason:
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    {request.rejectionReason}
                  </p>
                </div>
              )}

              {request.modificationNote && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">
                    Modification Request:
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    {request.modificationNote}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                {request.products.length} product line(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold">SKU</th>
                      <th className="text-left py-2 px-3 font-semibold">
                        Product Name
                      </th>
                      <th className="text-right py-2 px-3 font-semibold">
                        Quantity
                      </th>
                      <th className="text-left py-2 px-3 font-semibold">UOM</th>
                      <th className="text-right py-2 px-3 font-semibold">
                        Weight
                      </th>
                      {request.products.some((p) => p.batchNumber) && (
                        <th className="text-left py-2 px-3 font-semibold">
                          Batch
                        </th>
                      )}
                      {request.products.some((p) => p.expiryDate) && (
                        <th className="text-left py-2 px-3 font-semibold">
                          Expiry
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {request.products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-mono text-xs">
                          {product.sku}
                        </td>
                        <td className="py-2 px-3">{product.name}</td>
                        <td className="py-2 px-3 text-right font-semibold">
                          {product.quantity}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-600">
                          {product.uom}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600">
                          {product.weight} kg
                        </td>
                        {request.products.some((p) => p.batchNumber) && (
                          <td className="py-2 px-3 text-sm font-mono">
                            {product.batchNumber || "-"}
                          </td>
                        )}
                        {request.products.some((p) => p.expiryDate) && (
                          <td className="py-2 px-3 text-sm">
                            {product.expiryDate || "-"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="text-xs text-gray-600 min-w-max">
                    {new Date(request.createdAt).toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Request Created</p>
                    <p className="text-sm text-gray-600">
                      By {request.createdBy}
                    </p>
                  </div>
                </div>

                {request.approvedAt && (
                  <div className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="text-xs text-gray-600 min-w-max">
                      {new Date(request.approvedAt).toLocaleString()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Request Approved</p>
                      <p className="text-sm text-gray-600">
                        By {request.approvedBy}
                      </p>
                    </div>
                  </div>
                )}

                {request.rejectedAt && (
                  <div className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="text-xs text-gray-600 min-w-max">
                      {new Date(request.rejectedAt).toLocaleString()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-600">Request Rejected</p>
                      <p className="text-sm text-gray-600">
                        By {request.rejectedBy}
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        Reason: {request.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval Tab */}
        <TabsContent value="approval" className="space-y-4">
          <ApprovalStage
            key={refreshKey}
            request={request}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
