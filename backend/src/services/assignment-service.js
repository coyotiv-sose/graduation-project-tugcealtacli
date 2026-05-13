function getSkillLevel(employee, requiredSkill) {
    const key = String(requiredSkill).toLowerCase()
  
    if (Array.isArray(employee.skills)) {
      const row = employee.skills.find(s => s.name.toLowerCase() === key)
      if (row) return row.level
    }
  
    if (employee.mainSkill && employee.mainSkill.toLowerCase() === key) {
      return employee.skillLevel
    }
  
    return 0
  }
  
  function calculateAssignmentScore(employee, task) {
    const skillLevel = getSkillLevel(employee, task.requiredSkill)
    const workload = employee.activeWorkload()
    const rejectionCount = employee.failureCountForSkill(task.requiredSkill)
  
    const skillScore = skillLevel * 20
    const workloadPenalty = workload * 5
    const rejectionPenalty = rejectionCount * 15
  
    const total = skillScore - workloadPenalty - rejectionPenalty
  
    return {
      total,
      breakdown: {
        skillLevel,
        workload,
        rejectionCount,
        skillScore,
        workloadPenalty,
        rejectionPenalty,
      },
      reason: {
        skillLevel: `${task.requiredSkill} skill seviyesi: ${skillLevel}`,
        workload: `aktif iş yükü: ${workload}`,
        rejectionCount: `${task.requiredSkill} için red sayısı: ${rejectionCount}`,
       }
  }
  }
  
  function pickBestAssignee(employees, task) {
    const scored = employees.map(employee => ({
      employee,
      score: calculateAssignmentScore(employee, task),
    }))
  
    scored.sort((a, b) => b.score.total - a.score.total)
  
    return scored[0] || null
  }
  
  function getHelperCandidates(employees, task, assigneeIds = []) {
    return employees
      .filter(emp => !assigneeIds.includes(emp._id.toString()))
      .filter(emp => getSkillLevel(emp, task.requiredSkill) >= task.difficulty)
      .filter(emp => !emp.isBlockedForSkill(task.requiredSkill))
      .map(employee => ({
        employee,
        score: calculateAssignmentScore(employee, task),
      }))
      .sort((a, b) => b.score.total - a.score.total)
  }
  
  module.exports = {
    getSkillLevel,
    calculateAssignmentScore,
    pickBestAssignee,
    getHelperCandidates,
  }