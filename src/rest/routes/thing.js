export const queryMetrics = (req, res) => req.namespace.models.metric
  .query({ ...req.params, ...req.query })
  .then((response) => res.status(200)
    .json(response));

export const getMetric = (req, res) => req.namespace.models.metric
  .get(req.params.id)
  .then((data) => res.status(200).json(data));

export const saveMetric = (req, res) => req.namespace.models.metric
  .save(req.params.id, req.body)
  .then(() => res.status(200).json({}));

export const deleteMetric = (req, res) => req.namespace.models.metric
  .delete(req.params.id)
  .then(() => res.status(200).json({}));
