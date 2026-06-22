class FPGrowthService {
  generateRules(transactions, minSupport, minConfidence) {
    const total = transactions.length;
    if (total === 0) return this.emptyResult(total);
    
    const minSupCount = Math.max(1, Math.ceil(minSupport * total));
    
    // Hitung frekuensi item
    const itemFreq = new Map();
    for (const tx of transactions) {
      const unique = [...new Set(tx)];
      for (const item of unique) {
        itemFreq.set(item, (itemFreq.get(item) || 0) + 1);
      }
    }
    
    // Filter frequent 1-itemset
    const frequentItems = [];
    for (const [item, count] of itemFreq) {
      if (count >= minSupCount) frequentItems.push(item);
    }
    
    console.log('Frequent items count:', frequentItems.length);
    if (frequentItems.length < 2) {
      return this.emptyResult(total, minSupport, minConfidence, 'Tidak cukup frequent items');
    }
    
    // Generate pairs
    const pairs = [];
    for (let i = 0; i < frequentItems.length; i++) {
      for (let j = i+1; j < frequentItems.length; j++) {
        pairs.push([frequentItems[i], frequentItems[j]]);
      }
    }
    console.log('Candidate pairs:', pairs.length);
    
    // Hitung support pairs
    const pairSupport = [];
    for (const pair of pairs) {
      let count = 0;
      for (const tx of transactions) {
        if (tx.includes(pair[0]) && tx.includes(pair[1])) count++;
      }
      if (count >= minSupCount) {
        pairSupport.push({ items: pair, support: count/total, count });
      }
    }
    console.log('Frequent pairs:', pairSupport.length);
    
    if (pairSupport.length === 0) {
      return this.emptyResult(total, minSupport, minConfidence, 'Tidak ada pair yang memenuhi support');
    }
    
    // Generate rules
    const rules = [];
    for (const { items, support, count } of pairSupport) {
      const A = items[0];
      const B = items[1];
      const supA = itemFreq.get(A)/total;
      const supB = itemFreq.get(B)/total;
      const confAB = support / supA;
      const confBA = support / supB;
      
      if (confAB >= minConfidence) {
        const lift = confAB / supB;
        const kulc = 0.5 * (confAB + (support/supB));
        const lev = support - (supA * supB);
        const conv = supB < 1 ? (1-supB)/(1-confAB) : Infinity;
        let strength = 'Lemah';
        if (lift >= 2 && confAB >= 0.7) strength = 'Sangat Kuat';
        else if (lift >= 1.5 && confAB >= 0.6) strength = 'Kuat';
        else if (lift >= 1.2) strength = 'Sedang';
        rules.push({
          antecedent: A, consequent: B,
          support: parseFloat(support.toFixed(4)),
          confidence: parseFloat(confAB.toFixed(4)),
          lift: parseFloat(lift.toFixed(4)),
          conviction: conv === Infinity ? 999 : parseFloat(conv.toFixed(4)),
          leverage: parseFloat(lev.toFixed(4)),
          kulczynski: parseFloat(kulc.toFixed(4)),
          strength,
          description: `Jika membeli "${A}", ${(confAB*100).toFixed(1)}% juga membeli "${B}" (lift ${lift.toFixed(2)})`
        });
      }
      if (confBA >= minConfidence) {
        const lift = confBA / supA;
        const kulc = 0.5 * (confBA + (support/supA));
        const lev = support - (supB * supA);
        const conv = supA < 1 ? (1-supA)/(1-confBA) : Infinity;
        let strength = 'Lemah';
        if (lift >= 2 && confBA >= 0.7) strength = 'Sangat Kuat';
        else if (lift >= 1.5 && confBA >= 0.6) strength = 'Kuat';
        else if (lift >= 1.2) strength = 'Sedang';
        rules.push({
          antecedent: B, consequent: A,
          support: parseFloat(support.toFixed(4)),
          confidence: parseFloat(confBA.toFixed(4)),
          lift: parseFloat(lift.toFixed(4)),
          conviction: conv === Infinity ? 999 : parseFloat(conv.toFixed(4)),
          leverage: parseFloat(lev.toFixed(4)),
          kulczynski: parseFloat(kulc.toFixed(4)),
          strength,
          description: `Jika membeli "${B}", ${(confBA*100).toFixed(1)}% juga membeli "${A}" (lift ${lift.toFixed(2)})`
        });
      }
    }
    
    rules.sort((a,b) => b.lift - a.lift);
    const itemStats = [...itemFreq.entries()].map(([item, cnt]) => ({item, count: cnt, support: cnt/total})).sort((a,b)=>b.count-a.count).slice(0,10);
    
    return {
      success: true,
      data: {
        rules,
        totalRules: rules.length,
        totalTransactions: total,
        itemStats,
        parameters: { minSupport, minConfidence, minSupCount },
        method: 'FP-Growth (Simple)'
      }
    };
  }
  
  emptyResult(total, minSupport=0, minConfidence=0, reason='') {
    return {
      success: true,
      data: {
        rules: [],
        totalRules: 0,
        totalTransactions: total,
        itemStats: [],
        parameters: { minSupport, minConfidence },
        method: 'FP-Growth',
        errorReason: reason
      }
    };
  }
}

module.exports = new FPGrowthService();