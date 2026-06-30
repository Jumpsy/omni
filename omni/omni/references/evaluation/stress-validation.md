# Stress Validation

## Independent Review Passes
1. Run many independent critique passes when the task is visually or product-critical.
2. Use different reviewers for design coherence, UX, implementation, and business claims.
3. Prefer at least 10 independent passes for medium work and as many as practical for major releases.
4. Aggregate repeated findings instead of counting them as separate issues.
5. Escalate if independent reviewers disagree on a critical issue.

## Scale Readiness
1. Ask what happens at 10,000 concurrent or daily users, depending on the product.
2. Validate the app’s likely bottlenecks: rendering, data fetch, caching, backend throughput, and state growth.
3. If real load testing is unavailable, say so plainly.
4. Use proxy evidence such as performance traces, architecture review, and bottleneck analysis.
5. Never imply a load test passed when it did not run.

## Apple-Like Bar
1. Favor crisp visual hierarchy.
2. Eliminate rough spacing and alignment issues.
3. Ensure interactions feel deliberate.
4. Remove obvious placeholders.
5. Keep motion restrained.
6. Make empty and error states feel finished.
7. Treat polish as a functional requirement.
