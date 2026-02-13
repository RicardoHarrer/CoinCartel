import * as model from '../model/model.js';

const getTipsForUser = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const norm = (s) =>
      (s || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9äöüß\s\-_.]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 120);

    const pct = (x) => `${Math.round(x * 100)}%`;
    const sum = (arr, fn = (x) => x) => arr.reduce((acc, v) => acc + toNum(fn(v)), 0);

    const median = (arr) => {
      const a = [...arr].sort((x, y) => x - y);
      if (!a.length) return 0;
      const mid = Math.floor(a.length / 2);
      return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
    };

    const isWeekend = (d) => {
      const day = d.getDay();
      return day === 0 || day === 6;
    };

    const defaultActionForTip = (tip) => {
      const t = norm(tip?.title);

      if (t.includes('budget')) return 'Setze ein fixes Tageslimit und pausiere Spontankäufe bis Monatsende.';
      if (t.includes('cashflow')) return 'Senke diese Woche 1-2 variable Kategorien, bis der Cashflow wieder positiv ist.';
      if (t.includes('sparen') || t.includes('notgroschen'))
        return 'Richte einen automatischen Spar-Transfer direkt nach Einnahmen ein.';
      if (t.includes('wochenende')) return 'Lege ein Wochenend-Budget fest und tracke es separat.';
      if (t.includes('mikro')) return 'Setze ein Kleinbetrags-Limit pro Woche (z. B. 15-25 EUR).';
      if (t.includes('handler') || t.includes('hebel') || t.includes('trend'))
        return 'Definiere ein konkretes Monatslimit und prüfe den Fortschritt jede Woche.';
      if (t.includes('ziel')) return 'Lege einen Fixbetrag pro Monat fest und automatisiere die Buchung.';
      return 'Wähle einen Betrag als Limit und prüfe in 7 Tagen, ob du darunter bleibst.';
    };

    const buildSmartMessage = (tip) => {
      const base = (tip?.reason || '').toString().replace(/\s+/g, ' ').trim();
      const action = (tip?.action || '').toString().trim() || defaultActionForTip(tip);
      if (!base) return action;
      if (/(aktion:|fix:|tipp:|n(ä|ae)chster schritt:)/i.test(base)) return base;
      return `${base} Nächster Schritt: ${action}`;
    };

    const addTip = (tips, tip) => {
      const message = tip.message || buildSmartMessage(tip);
      tips.push({
        title: tip.title,
        message,
        reason: tip.reason || message,
        action: tip.action || defaultActionForTip(tip),
        priority: tip.priority || 'info',
        impact: tip.impact || '—',
        icon: tip.icon || 'tips_and_updates',
        _score: Number.isFinite(tip._score) ? tip._score : 0,
      });
    };

    const FIXED_CAT_IDS = new Set([2, 6, 7, 8]);
    const TRANSPORT_CAT_ID = 5;
    const SAVING_CAT_ID = 11;

    const txRes = await model.getTransactionsWithCategoriesByUser(id, startDate, endDate);
    const tx = txRes?.rows || [];

    const prefRes = await model.getUserPreferencesByUser(id);
    const pref = prefRes?.rows?.[0] || { saldo: 0, preferred_currency: 'EUR' };
    const budget = toNum(pref.saldo);
    const currency = pref.preferred_currency || 'EUR';

    const categoriesRes = await model.getCategories();
    const categories = categoriesRes?.rows || [];

    const categoryById = new Map();
    for (const c of categories)
      categoryById.set(Number(c.id), { name: c.name, description: c.description });

    let goals = [];
    try {
      goals = (await model.getGoalProgress(id)) || [];
    } catch {
      goals = [];
    }

    if (!tx.length) {
      return res.status(200).json({
        tips: [
          {
            title: 'Noch keine Daten',
            message: 'Im ausgewählten Zeitraum wurden keine Transaktionen gefunden.',
            reason: 'Im ausgewählten Zeitraum wurden keine Transaktionen gefunden.',
            priority: 'info',
            impact: '—',
            icon: 'info',
          },
        ],
        meta: { startDate: startDate || null, endDate: endDate || null, currency },
      });
    }

    const expenses = tx
      .filter((t) => t.transaction_type === 'Ausgabe')
      .map((t) => ({
        ...t,
        amount: toNum(t.amount),
        dateObj: new Date(t.date),
        descN: norm(t.description),
      }))
      .filter((t) => t.amount > 0);

    const incomes = tx
      .filter((t) => t.transaction_type === 'Einnahme')
      .map((t) => ({
        ...t,
        amount: toNum(t.amount),
        dateObj: new Date(t.date),
        descN: norm(t.description),
      }))
      .filter((t) => t.amount > 0);

    const totalExpense = sum(expenses, (t) => t.amount);
    const totalIncome = sum(incomes, (t) => t.amount);
    const netCashflow = totalIncome - totalExpense;

    const fixedCosts = expenses.filter((t) => FIXED_CAT_IDS.has(Number(t.category_id)));
    const savingCosts = expenses.filter((t) => Number(t.category_id) === SAVING_CAT_ID);
    const transportCosts = expenses.filter((t) => Number(t.category_id) === TRANSPORT_CAT_ID);

    const fixedSum = sum(fixedCosts, (t) => t.amount);
    const savingSum = sum(savingCosts, (t) => t.amount);
    const transportSum = sum(transportCosts, (t) => t.amount);

    const savingRatio = totalIncome > 0 ? savingSum / totalIncome : null;

    const variableExpenses = expenses.filter(
      (t) => !FIXED_CAT_IDS.has(Number(t.category_id)) && Number(t.category_id) !== SAVING_CAT_ID,
    );
    const variableSum = sum(variableExpenses, (t) => t.amount);

    const weekendVarExp = variableExpenses.filter((t) => isWeekend(t.dateObj));
    const weekendVarSum = sum(weekendVarExp, (t) => t.amount);
    const weekendVarRatio = variableSum > 0 ? weekendVarSum / variableSum : 0;

    const microThreshold = 5;
    const micro = variableExpenses.filter((t) => t.amount <= microThreshold);
    const microSum = sum(micro, (t) => t.amount);

    const amounts = variableExpenses.map((t) => t.amount);
    const med = median(amounts);
    const absDev = amounts.map((x) => Math.abs(x - med));
    const mad = median(absDev) || 0;
    const spikeCut = mad > 0 ? med + 6 * mad : med * 4;

    const spikes = [...variableExpenses]
      .filter((t) => t.amount >= Math.max(200, spikeCut))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const merchantMap = new Map();
    for (const t of variableExpenses) {
      const key = t.descN || 'unknown';
      if (key === 'unknown' || key.length < 3) continue;
      const e = merchantMap.get(key) || {
        key,
        amount: 0,
        count: 0,
        sample: t.description || key,
      };
      e.amount += t.amount;
      e.count += 1;
      merchantMap.set(key, e);
    }
    const merchants = Array.from(merchantMap.values()).sort((a, b) => b.amount - a.amount);
    const topMerchant = merchants[0];

    const recMap = new Map();
    for (const t of variableExpenses) {
      const descKey = t.descN;
      if (!descKey || descKey === 'unknown') continue;
      const key = `${descKey}::${t.category_id ?? 'x'}`;
      const e = recMap.get(key) || {
        sample: t.description || descKey,
        amounts: [],
        dates: [],
      };
      e.amounts.push(t.amount);
      e.dates.push(t.dateObj);
      recMap.set(key, e);
    }

    const recurring = [];
    for (const e of recMap.values()) {
      if (e.amounts.length < 3) continue;
      const avg = e.amounts.reduce((a, b) => a + b, 0) / e.amounts.length;
      const maxDev = Math.max(...e.amounts.map((x) => Math.abs(x - avg)));
      const stable = maxDev <= Math.max(1, avg * 0.08);
      if (!stable) continue;

      const ds = e.dates.sort((a, b) => a - b);
      const diffs = [];
      for (let i = 1; i < ds.length; i++) diffs.push((ds[i] - ds[i - 1]) / (1000 * 60 * 60 * 24));
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

      let interval = null;
      if (avgDiff >= 27 && avgDiff <= 35) interval = 'monthly';
      else if (avgDiff >= 6 && avgDiff <= 8) interval = 'weekly';
      else if (avgDiff >= 13 && avgDiff <= 16) interval = 'biweekly';

      recurring.push({
        description: e.sample,
        avg: Number(avg.toFixed(2)),
        count: e.amounts.length,
        interval,
      });
    }

    const recurringSorted = recurring.sort((a, b) => b.avg * b.count - a.avg * a.count).slice(0, 6);

    const catMap = new Map();
    for (const t of variableExpenses) {
      const key = Number(t.category_id) || 0;
      const info = categoryById.get(key);
      const name = t.category_name || info?.name || 'Uncategorized';
      const entry = catMap.get(key) || { id: key, name, amount: 0, count: 0 };
      entry.amount += t.amount;
      entry.count += 1;
      catMap.set(key, entry);
    }
    const variableCats = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount);
    const topVariableCat = variableCats[0];

    const playbookByName = (nameRaw) => {
      const n = norm(nameRaw);
      if (!n) return null;

      if (
        n.includes('essen')
        || n.includes('food')
        || n.includes('restaurant')
        || n.includes('takeaway')
        || n.includes('lebensmittel')
      ) {
        return {
          icon: 'restaurant',
          text: 'Hebel: Wochenbudget + Meal-Plan. Regel: nur 2 Takeaway-Tage/Woche. Tracke Kaffee/Snacks separat.',
        };
      }

      if (
        n.includes('freizeit')
        || n.includes('entertain')
        || n.includes('kino')
        || n.includes('party')
        || n.includes('events')
        || n.includes('games')
      ) {
        return {
          icon: 'local_activity',
          text: 'Hebel: Freizeit-Budget fixieren. Regel: 1 großes Event/Monat, Rest low-cost.',
        };
      }

      if (
        n.includes('shopping')
        || n.includes('kleidung')
        || n.includes('amazon')
        || n.includes('mode')
        || n.includes('electronics')
        || n.includes('technik')
      ) {
        return {
          icon: 'shopping_bag',
          text: 'Hebel: 30-Tage-Regel + Wunschliste. Limit: max. 1 größerer Kauf/Monat. Vor Kauf 3 Preise vergleichen.',
        };
      }

      if (
        n.includes('transport')
        || n.includes('uber')
        || n.includes('taxi')
        || n.includes('auto')
        || n.includes('benzin')
        || n.includes('fuel')
        || n.includes('bahn')
        || n.includes('ticket')
      ) {
        return {
          icon: 'directions_car',
          text: 'Hebel: Taxi-Regel + Wege bündeln. Prüfe Monatskarte/Flatrate vs Einzel-Fahrten.',
        };
      }

      if (
        n.includes('abo')
        || n.includes('subscription')
        || n.includes('stream')
        || n.includes('netflix')
        || n.includes('spotify')
        || n.includes('prime')
        || n.includes('gym')
      ) {
        return {
          icon: 'repeat',
          text: 'Hebel: Abos auditieren. Regel: 1 Streaming gleichzeitig. Downgrade/Family/Student Tarife prüfen.',
        };
      }

      if (
        n.includes('gesund')
        || n.includes('health')
        || n.includes('apotheke')
        || n.includes('arzt')
        || n.includes('fitness')
      ) {
        return {
          icon: 'health_and_safety',
          text: 'Hebel: fixe Budgets statt spontane Käufe. Große Kosten: Angebote/Alternativen prüfen.',
        };
      }

      if (
        n.includes('bildung')
        || n.includes('education')
        || n.includes('kurs')
        || n.includes('course')
        || n.includes('lernen')
      ) {
        return {
          icon: 'school',
          text: 'Hebel: nur 1 Kurs gleichzeitig. Budget pro Quartal setzen und laufende Abos pausieren wenn nicht genutzt.',
        };
      }

      return null;
    };

    const tips = [];

    if (budget > 0) {
      const usage = totalExpense / budget;
      if (usage >= 1) {
        addTip(tips, {
          title: 'Budget überschritten',
          reason: `Du bist bei ${pct(usage)} (${totalExpense.toFixed(2)} / ${budget.toFixed(2)} ${currency}). Fokus: steuerbare Posten deckeln.`,
          priority: 'hoch',
          impact: 'Sofort spürbar',
          icon: 'report_problem',
          _score: 100,
        });
      } else if (usage >= 0.9) {
        addTip(tips, {
          title: 'Budget-Pacing: nahe am Limit',
          reason: `Du bist bei ${pct(usage)}. Für den Rest: Tageslimit setzen + keine Spontankäufe.`,
          priority: 'hoch',
          impact: '10–150€ möglich',
          icon: 'speed',
          _score: 86,
        });
      } else if (usage >= 0.75) {
        addTip(tips, {
          title: 'Budget-Pacing aktivieren',
          reason: `Du bist bei ${pct(usage)}. Ab jetzt nur geplante Ausgaben, keine “weil gerade Bock”.`,
          priority: 'mittel',
          impact: '10–80€ möglich',
          icon: 'tune',
          _score: 58,
        });
      }
    }

    if (totalIncome > 0) {
      if (netCashflow < 0) {
        addTip(tips, {
          title: 'Cashflow ist negativ',
          reason: `Du bist bei ${netCashflow.toFixed(2)} ${currency}. Quick-Fix: steuerbare Kategorien deckeln (bis wieder ≥ 0).`,
          priority: 'hoch',
          impact: 'Sehr wichtig',
          icon: 'trending_down',
          _score: 92,
        });
      } else {
        if (savingSum === 0) {
          addTip(tips, {
            title: 'Automatisiere Sparen',
            reason: `Du hast +${netCashflow.toFixed(2)} ${currency} übrig. Auto-Transfer (Kategorie 11) direkt nach Einnahmen (z.B. 10%).`,
            priority: 'mittel',
            impact: 'Routine & Stabilität',
            icon: 'auto_mode',
            _score: 52,
          });
        }
        if (savingRatio !== null && savingRatio >= 0.1) {
          const emergencyTarget = fixedSum * 3;
          if (emergencyTarget > 0) {
            addTip(tips, {
              title: 'Notgroschen als nächster Step',
              reason: `Orientierung: 3 Monats-Fixkosten ≈ ${emergencyTarget.toFixed(2)} ${currency}. Danach Investieren priorisieren.`,
              priority: 'info',
              impact: 'Langfristig',
              icon: 'shield',
              _score: 22,
            });
          }
        }
      }
    }

    if (topVariableCat && variableSum > 0) {
      const shareVar = topVariableCat.amount / variableSum;
      const pb = playbookByName(topVariableCat.name);
      addTip(tips, {
        title: 'Größter steuerbarer Hebel',
        reason: `${topVariableCat.name}: ${topVariableCat.amount.toFixed(2)} ${currency} (${pct(shareVar)} steuerbar). ${
          pb?.text || 'Hebel: Monatslimit setzen und wöchentlich tracken.'
        }`,
        priority: shareVar >= 0.3 ? 'hoch' : 'mittel',
        impact: shareVar >= 0.3 ? '20–200€ möglich' : '10–120€ möglich',
        icon: pb?.icon || 'tune',
        _score: 74,
      });
    }

    if (micro.length >= 12 && microSum >= 25) {
      addTip(tips, {
        title: 'Mikro-Leak erkannt',
        reason: `${micro.length} Ausgaben ≤ ${microThreshold}€ summieren sich auf ${microSum.toFixed(2)} ${currency}. Tipp: Kleinzeug-Limit oder Cash-Envelope.`,
        priority: 'mittel',
        impact: '10–80€ möglich',
        icon: 'local_cafe',
        _score: 56,
      });
    }

    if (weekendVarRatio >= 0.45 && weekendVarSum > 0) {
      addTip(tips, {
        title: 'Wochenenden treiben die Ausgaben',
        reason: `Am Wochenende entstehen ${pct(weekendVarRatio)} deiner steuerbaren Ausgaben (${weekendVarSum.toFixed(2)} ${currency}). Wochenend-Budget setzen.`,
        priority: 'mittel',
        impact: '10–150€ möglich',
        icon: 'event',
        _score: 48,
      });
    }

    if (topMerchant && topMerchant.count >= 3 && variableSum > 0) {
      const mShareVar = topMerchant.amount / variableSum;
      if (mShareVar >= 0.18) {
        const suggestedCap = Math.max(10, Math.round((topMerchant.amount * 0.75) / 5) * 5);
        addTip(tips, {
          title: 'Händler-Fokus',
          reason: `„${topMerchant.sample}“: ${topMerchant.count}×, ${topMerchant.amount.toFixed(2)} ${currency} (${pct(
            mShareVar,
          )}). Smart-Cap fürs nächste Monat: ${suggestedCap} ${currency}.`,
          priority: 'mittel',
          impact: '5–120€ möglich',
          icon: 'store',
          _score: 52,
        });
      }
    }

    if (spikes.length) {
      const s = spikes[0];
      const spikeName = s.description || 'Große Ausgabe';
      const spikeCat =        s.category_name || categoryById.get(Number(s.category_id))?.name || 'Kategorie';
      addTip(tips, {
        title: 'Ausgaben-Spike',
        reason: `„${spikeName}“ (${spikeCat}): ${s.amount.toFixed(2)} ${currency}. Rücklage-Idee: ${Math.max(
          20,
          Math.round(s.amount / 6 / 5) * 5,
        )} ${currency}/Monat für 6 Monate.`,
        priority: 'mittel',
        impact: 'Spikes planbar machen',
        icon: 'show_chart',
        _score: 55,
      });
    }

    if (transportSum >= 120) {
      addTip(tips, {
        title: 'Transport-Kostenhebel',
        reason: `Transport: ${transportSum.toFixed(2)} ${currency}. Ticket/Monatskarte prüfen + klare Taxi-Regel.`,
        priority: 'info',
        impact: '5–60€ möglich',
        icon: 'directions_bus',
        _score: 22,
      });
    }

    const recurringWithInterval = recurringSorted.filter((r) => r.interval);
    for (const r of recurringWithInterval.slice(0, 3)) {
      const label =        r.interval === 'monthly'
          ? 'Monatlicher Fixposten'
          : r.interval === 'weekly'
            ? 'Wöchentlicher Fixposten'
            : 'Regelmäßiger Fixposten';
      const cap = Math.max(5, Math.round((r.avg * 0.85) / 5) * 5);
      addTip(tips, {
        title: `${label} prüfen`,
        reason: `„${r.description}“ (${r.count}×, Ø ${r.avg.toFixed(2)} ${currency}). Aktion: kündigen/downgraden oder Zielwert ${cap} ${currency}.`,
        priority: r.avg >= 15 ? 'hoch' : 'mittel',
        impact: r.interval === 'monthly' ? `${r.avg.toFixed(2)} ${currency}/Monat` : 'variabel',
        icon: 'repeat',
        _score: 62,
      });
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const isMonthlyRange =      start
      && end
      && start.getFullYear() === end.getFullYear()
      && start.getMonth() === end.getMonth();

    if (isMonthlyRange) {
      const prevStart = new Date(start);
      prevStart.setMonth(prevStart.getMonth() - 1);
      const prevEnd = new Date(end);
      prevEnd.setMonth(prevEnd.getMonth() - 1);

      const prevRes = await model.getTransactionsWithCategoriesByUser(
        id,
        prevStart.toISOString().slice(0, 10),
        prevEnd.toISOString().slice(0, 10),
      );
      const prevTx = prevRes?.rows || [];

      const sumVariableRows = (rows) => {
        const ex = rows
          .filter((t) => t.transaction_type === 'Ausgabe')
          .map((t) => ({ amount: toNum(t.amount), category_id: t.category_id }))
          .filter((t) => t.amount > 0);
        const vars = ex.filter(
          (t) =>
            !FIXED_CAT_IDS.has(Number(t.category_id)) && Number(t.category_id) !== SAVING_CAT_ID,
        );
        return sum(vars, (t) => t.amount);
      };

      const prevVar = sumVariableRows(prevTx);
      if (prevVar > 0) {
        const change = (variableSum - prevVar) / prevVar;

        if (change >= 0.2) {
          addTip(tips, {
            title: 'Trend: steuerbare Ausgaben gestiegen',
            reason: `Vormonat: ${prevVar.toFixed(2)} → jetzt: ${variableSum.toFixed(2)} ${currency} (${pct(
              change,
            )}). Fokus: Abos/Recurring + Wochenenden + Mikro-Leaks.`,
            priority: 'hoch',
            impact: '20–200€ möglich',
            icon: 'trending_up',
            _score: 82,
          });
        } else if (change <= -0.15) {
          addTip(tips, {
            title: 'Trend: du bist besser geworden',
            reason: `Steuerbare Ausgaben sind um ${pct(Math.abs(change))} gesunken (${prevVar.toFixed(
              2,
            )} → ${variableSum.toFixed(2)} ${currency}).`,
            priority: 'info',
            impact: 'Sehr gut',
            icon: 'thumb_up',
            _score: 28,
          });
        }
      }
    }

    const overdue = goals.filter((g) => g.status === 'overdue');
    const lowProgress = goals
      .filter((g) => g.status === 'in_progress' && toNum(g.progress_percentage) < 35)
      .slice(0, 2);

    if (overdue.length) {
      addTip(tips, {
        title: 'Ziel(e) überfällig',
        reason: `${overdue.length} Ziel(e) sind überfällig. Fix: Auto-Transfer (Kategorie 11) direkt nach Einnahmen.`,
        priority: 'hoch',
        impact: 'Zielerreichung',
        icon: 'flag',
        _score: 72,
      });
    }

    for (const g of lowProgress) {
      addTip(tips, {
        title: 'Ziel-Fortschritt niedrig',
        reason: `„${g.title}“: ${Math.round(toNum(g.progress_percentage))}%. Fixbetrag/Monat + automatisieren.`,
        priority: 'mittel',
        impact: 'Zielerreichung',
        icon: 'flag_circle',
        _score: 38,
      });
    }

    if (tips.length < 5) {
      addTip(tips, {
        title: 'Schneller Hebel: 24h-Regel',
        reason: 'Bei nicht notwendigen Ausgaben >50€: 24h warten. Reduziert Impulskäufe extrem.',
        priority: 'info',
        impact: 'Impuls reduzieren',
        icon: 'hourglass_empty',
        _score: 10,
      });
    }

    const out = tips
      .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
      .slice(0, 10)
      .map(({ _score, ...t }) => t);

    return res.status(200).json({
      tips: out,
      meta: {
        startDate: startDate || null,
        endDate: endDate || null,
        currency,
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2)),
        netCashflow: Number(netCashflow.toFixed(2)),
        fixedCosts: Number(fixedSum.toFixed(2)),
        saving: Number(savingSum.toFixed(2)),
        weekendSpending: Number(weekendVarSum.toFixed(2)),
        microSpending: Number(microSum.toFixed(2)),
        variableSpending: Number(variableSum.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error generating PRO tips:', error);
    return res.status(500).json({ error: 'Failed to generate tips' });
  }
};
export { getTipsForUser };
