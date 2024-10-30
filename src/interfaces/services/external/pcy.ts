export interface JobStatus {
    status: "idle" | "running" | "completed";
    start_time: Date | string | null;
    /** In seconds */
    elapsed_time: number;
    result: string;
    files: {
        frequent_pairs?: "/download/frequent_pairs.csv";
        association_rules?: "/download/association_rules.csv";
    };
}

export interface AssociationRule {
    antecedent: string;
    consequent: string;
    confidence: string | number;
}
