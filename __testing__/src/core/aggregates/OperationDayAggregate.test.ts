import { OperationDayAggregate } from "@/src/core/aggregates/OperationDayAggregate";
import { DayOperation } from "@/src/core/entities/DayOperation";
import { RouteTransaction } from "@/src/core/entities/RouteTransaction";
import { RouteTransactionState } from "@/src/core/enums/RouteTransactionState";
import { PaymentMethod } from "@/src/core/object-values/PaymentMethod";
import { ShiftDayOperations } from "@/src/core/enums/ShiftDayOperations";

describe("OperationDayAggregate", () => {
    let aggregate: OperationDayAggregate;

    beforeEach(() => {
        aggregate = new OperationDayAggregate(null, null);
    });

    describe("registerAttendTodaysClient", () => {
        it("should register a client attention operation and push it to dayOperations", () => {
            const idDayOperation = "op-1";
            const idClient = "client-1";
            const createdAt = new Date();

            aggregate.registerAttendTodaysClient(idDayOperation, idClient, createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps).not.toBeNull();
            expect(dayOps!.length).toBe(1);
            expect(dayOps![0].id_day_operation).toBe(idDayOperation);
            expect(dayOps![0].id_item).toBe(idClient);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.ROUTE_CLIENT_ATTENTION);
            expect(dayOps![0].created_at).toEqual(createdAt);
        });

        it("should push multiple client attention operations in order", () => {
            const createdAt = new Date();

            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);
            aggregate.registerAttendTodaysClient("op-2", "client-2", createdAt);
            aggregate.registerAttendTodaysClient("op-3", "client-3", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps!.length).toBe(3);
            expect(dayOps![0].id_item).toBe("client-1");
            expect(dayOps![1].id_item).toBe("client-2");
            expect(dayOps![2].id_item).toBe("client-3");
        });
    });

    describe("registerClientAttentionOutOfRoute", () => {
        it("should register an out-of-route client attention operation", () => {
            const createdAt = new Date();
            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);

            aggregate.registerClientAttentionOutOfRoute("op-2", "client-2", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps!.length).toBe(2);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.ATTENTION_OUT_OF_ROUTE);
            expect(dayOps![0].id_item).toBe("client-2");
        });

        it("should register out-of-route operation when no dayOperations exist", () => {
            const createdAt = new Date();

            aggregate.registerClientAttentionOutOfRoute("op-1", "client-1", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps).not.toBeNull();
            expect(dayOps!.length).toBe(1);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.ATTENTION_OUT_OF_ROUTE);
        });
    });

    describe("registerCreateNewClient", () => {
        it("should register a new client creation operation", () => {
            const createdAt = new Date();
            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);

            aggregate.registerCreateNewClient("op-2", "new-client", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps!.length).toBe(2);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.NEW_CLIENT_REGISTRATION);
            expect(dayOps![0].id_item).toBe("new-client");
        });

        it("should register new client operation when no dayOperations exist", () => {
            const createdAt = new Date();

            aggregate.registerCreateNewClient("op-1", "new-client", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps).not.toBeNull();
            expect(dayOps!.length).toBe(1);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.NEW_CLIENT_REGISTRATION);
        });
    });

    describe("registerRouteTransaction", () => {
        it("should register a route transaction operation", () => {
            const createdAt = new Date();
            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);

            aggregate.registerRouteTransaction("op-2", "transaction-1", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps!.length).toBe(2);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.ROUTE_TRANSACTION);
            expect(dayOps![0].id_item).toBe("transaction-1");
        });

        it("should register route transaction when no dayOperations exist", () => {
            const createdAt = new Date();

            aggregate.registerRouteTransaction("op-1", "transaction-1", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps).not.toBeNull();
            expect(dayOps!.length).toBe(1);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.ROUTE_TRANSACTION);
        });
    });

    describe("registerInventoryOperation", () => {
        it("should register an inventory operation", () => {
            const createdAt = new Date();
            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);

            aggregate.registerInventoryOperation("op-2", "inv-1", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps!.length).toBe(2);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.INVENTORY_OPERATION);
            expect(dayOps![0].id_item).toBe("inv-1");
        });

        it("should register inventory operation when no dayOperations exist", () => {
            const createdAt = new Date();

            aggregate.registerInventoryOperation("op-1", "inv-1", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps).not.toBeNull();
            expect(dayOps!.length).toBe(1);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.INVENTORY_OPERATION);
        });
    });

    describe("getDayOperations", () => {
        it("should return null when no operations are registered", () => {
            expect(aggregate.getDayOperations()).toBeNull();
        });

        it("should return array of day operations after registering operations", () => {
            const createdAt = new Date();
            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps).not.toBeNull();
            expect(Array.isArray(dayOps)).toBe(true);
            expect(dayOps!.length).toBeGreaterThan(0);
        });
    });

    describe("insertOperationDayNextToCurrentOperation - integration tests", () => {
        it("should insert out-of-route operation next to first route client attention without transaction", () => {
            const createdAt = new Date();
            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);
            aggregate.registerAttendTodaysClient("op-2", "client-2", createdAt);

            aggregate.registerClientAttentionOutOfRoute("op-3", "client-out", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps!.length).toBe(3);
            // Should be inserted after the current operation (last ROUTE_CLIENT_ATTENTION without transaction)
            expect(dayOps![dayOps!.length - 1].operation_type).toBe(ShiftDayOperations.ATTENTION_OUT_OF_ROUTE);
        });

        it("should insert operation at the beginning when current operation is at index 0", () => {
            const createdAt = new Date();
            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);

            aggregate.registerCreateNewClient("op-2", "new-client", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps!.length).toBe(2);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.NEW_CLIENT_REGISTRATION);
        });

        it("should handle complex scenario with multiple operation types", () => {
            const createdAt = new Date();
            
            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);
            aggregate.registerAttendTodaysClient("op-2", "client-2", createdAt);
            aggregate.registerRouteTransaction("op-3", "transaction-1", createdAt);
            aggregate.registerCreateNewClient("op-4", "new-client", createdAt);
            aggregate.registerInventoryOperation("op-5", "inv-1", createdAt);

            const dayOps = aggregate.getDayOperations();
            expect(dayOps!.length).toBe(5);
            expect(dayOps![0].operation_type).toBe(ShiftDayOperations.ROUTE_CLIENT_ATTENTION);
            expect(dayOps![1].operation_type).toBe(ShiftDayOperations.ROUTE_CLIENT_ATTENTION);
        });
    });

    describe("determineIndexCurrentOperation - business rule", () => {
        it("should identify current operation as first ROUTE_CLIENT_ATTENTION without associated transaction", () => {
            const createdAt = new Date();
            
            // Create route transactions for client-1 but not client-2
            const routeTransactions = [
                new RouteTransaction(
                    "t-1",
                    createdAt.toISOString(),
                    RouteTransactionState.ACTIVE,
                    100,
                    "wd-1",
                    "client-1",
                    new PaymentMethod("pm-1", "CASH"),
                    []
                )
            ];
            const aggregateWithTransactions = new OperationDayAggregate(null, routeTransactions);

            aggregateWithTransactions.registerAttendTodaysClient("op-1", "client-1", createdAt);
            aggregateWithTransactions.registerAttendTodaysClient("op-2", "client-2", createdAt);

            // Register operation - should insert next to client-2 (first ROUTE_CLIENT_ATTENTION without transaction)
            aggregateWithTransactions.registerCreateNewClient("op-3", "new-client", createdAt);

            const dayOps = aggregateWithTransactions.getDayOperations();
            expect(dayOps!.length).toBe(3);
            // The operation should be inserted after client-2 (the current operation)
        });

        it("should use last operation as current when all have transactions", () => {
            const createdAt = new Date();
            
            const routeTransactions = [
                new RouteTransaction(
                    "t-1",
                    createdAt.toISOString(),
                    RouteTransactionState.ACTIVE,
                    100,
                    "wd-1",
                    "client-1",
                    new PaymentMethod("pm-1", "CASH"),
                    []
                ),
                new RouteTransaction(
                    "t-2",
                    createdAt.toISOString(),
                    RouteTransactionState.ACTIVE,
                    100,
                    "wd-1",
                    "client-2",
                    new PaymentMethod("pm-1", "CASH"),
                    []
                )
            ];
            const aggregateWithTransactions = new OperationDayAggregate(null, routeTransactions);

            aggregateWithTransactions.registerAttendTodaysClient("op-1", "client-1", createdAt);
            aggregateWithTransactions.registerAttendTodaysClient("op-2", "client-2", createdAt);

            aggregateWithTransactions.registerCreateNewClient("op-3", "new-client", createdAt);

            const dayOps = aggregateWithTransactions.getDayOperations();
            expect(dayOps!.length).toBe(3);
            // Operation should be appended after the last operation
        });
    });

    describe("Edge cases", () => {
        it("should handle sequential operations without throwing errors", () => {
            const createdAt = new Date();

            expect(() => {
                aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);
                aggregate.registerClientAttentionOutOfRoute("op-2", "client-2", createdAt);
                aggregate.registerCreateNewClient("op-3", "client-3", createdAt);
                aggregate.registerRouteTransaction("op-4", "tr-1", createdAt);
                aggregate.registerInventoryOperation("op-5", "inv-1", createdAt);
            }).not.toThrow();
        });

        it("should properly initialize dayOperations array on first operation", () => {
            const createdAt = new Date();
            let dayOps = aggregate.getDayOperations();
            expect(dayOps).toBeNull();

            aggregate.registerAttendTodaysClient("op-1", "client-1", createdAt);

            dayOps = aggregate.getDayOperations();
            expect(dayOps).not.toBeNull();
            expect(Array.isArray(dayOps)).toBe(true);
        });
    });
});
