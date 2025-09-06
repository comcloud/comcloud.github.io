> **MAE（Mean Absolute Error，平均绝对误差）**是回归任务中常用的一种评价指标，用于衡量模型预测值与真实值之间的差异。它反映了预测结果的平均偏差大小，越小的MAE值表示模型的预测性能越好。

### 1. **公式**
MAE的计算公式如下：

$$
MAE = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i|
$$



- \( $n$ \) 是样本数量（即数据点的个数）。
- \($ y_i$ \) 是第 \($ i$ \) 个样本的真实值（目标值）。
- \( $\hat{y}_i $\) 是第 \($ i$ \) 个样本的预测值。
- \($ |y_i - \hat{y}_i| $\) 表示第 \($ i$ \) 个样本的**绝对误差**，即真实值与预测值之间的差的绝对值。

### 2. **MAE的特点**
> **对异常值敏感性较低**：与其他误差度量（如MSE）相比，MAE对异常值（outliers）不是特别敏感，因为它使用的是**绝对误差**而不是平方误差。
>
> - 在 MSE 中，误差的平方使得大误差对最终结果有更大的影响，而在 MAE 中，每个误差都是线性的。

### 3. **与MSE的对比**
- MSE 更容易受到较大的错误（离群点）的影响，因为误差的平方会放大大的误差。这使得 MSE 在处理有异常值的数据时可能不如 MAE 稳定。
- MSE 在梯度下降等优化过程中常被使用，因为其**平方误差更容易求导**。
- MAE在$y_i = \hat{y}_i$处不可导

~~~python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import SGDRegressor
from sklearn.metrics import mean_absolute_error

# 生成正常数据
np.random.seed(0)
x = np.linspace(0, 10, 50).reshape(-1, 1)  # 生成50个样本点
y_true = 2 * x + 1  # 真实值为线性关系
# 添加一定的噪声来模拟回归中的散点
y_true = y_true + np.random.normal(0, 2, size=x.shape[0]).reshape(-1, 1)  # 加入标准差为2的噪声

# 生成线性回归模型
model = SGDRegressor(loss='epsilon_insensitive', max_iter=1000, tol=1e-3)

# 没有离群点的数据拟合
y_pred_no_outliers = model.fit(x, y_true).predict(x)
mae_no_outliers = mean_absolute_error(y_true, y_pred_no_outliers)

# 添加离群点
y_with_outliers = y_true.copy()
y_with_outliers[45:] = y_with_outliers[45:] + np.random.randint(30, 50, 5).reshape(-1, 1)  # 添加一些离群点

# 使用带有离群点的数据进行拟合
y_pred_with_outliers = model.fit(x, y_with_outliers).predict(x)
mae_with_outliers = mean_absolute_error(y_with_outliers, y_pred_with_outliers)

# 绘制结果
plt.figure(figsize=(10, 6))

# 绘制没有离群点的数据拟合结果
plt.scatter(x, y_true, color='blue', label='True Values', s=50)
plt.plot(x, y_pred_no_outliers, color='green', label=f'Linear Fit (No Outliers), MAE = {mae_no_outliers:.2f}')

# 绘制带有离群点的数据拟合结果
plt.scatter(x[45:], y_with_outliers[45:], color='red', label='Outliers', s=100)
plt.plot(x, y_pred_with_outliers, color='orange', label=f'Linear Fit (With Outliers), MAE = {mae_with_outliers:.2f}')

# 图形装饰
plt.title('Effect of Outliers on Linear Regression Fit')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()
plt.grid(True)
plt.show()

~~~
